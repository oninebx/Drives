using System.Globalization;
using System.Net;
using Asp.Versioning;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Refit;
using Tower.Core;
using Tower.Core.Encryption;
using Tower.Core.Middleware.WhiteLabelling;
using Tower.Core.Models.Dxp;
using Tower.Core.Models.Dxp.Interfaces;
using Tower.Core.Models.Policy;
using Tower.Digital.Policy.Exceptions;
using Tower.Digital.Policy.HttpClients;
using Tower.Digital.Policy.Mappings;
using Tower.Digital.Policy.Models.Core;
using Tower.Digital.Policy.Models.Core.Home;
using Tower.Digital.Policy.Models.Core.Motor;
using Tower.Digital.Policy.Models.Quote;
using Tower.Digital.Policy.Models.Quote.V2;
using Tower.Digital.Policy.Services;
using TwrQuotePaymentPlanUpdateRateRequest = Tower.Core.Models.Dxp.TwrQuotePaymentPlanUpdateRateRequest;
using TwrQuotePolicyCountUpdateRequest = Tower.Core.Models.Dxp.TwrQuotePolicyCountUpdateRequest;

namespace Tower.Digital.Policy.Controllers.V2
{
    /// <summary>
    /// Controller for Quote API
    /// </summary>
    [ApiVersion("2.0")]
    [Route("policy/v{version:apiVersion}/quote")]
    [ApiController]
    public class QuoteController : ControllerBase
    {
        private const string XCorrelationId = "x-correlation-id";
        private readonly IAddressClient _addressClient;
        private readonly IVehicleClient _vehicleClient;
        private readonly IDxpClient _dxpClient;
        private readonly ICustomerNumberService _customerNumberService;
        private readonly IMapper _mapper;
        private readonly IEncryptionService _encryptionService;
        private readonly IDateTime _dateAdapter;
        private readonly WhiteLabelSettings _whiteLabelSettings;
        private readonly Tower.Core.Logging.ILogger<QuoteController> _logger;

        /// <summary>
        /// Constructor for QuoteController
        /// </summary>
        /// <param name="addressClient"></param>
        /// <param name="vehicleClient"></param>
        /// <param name="dxpClient"></param>
        /// <param name="customerNumberService"></param>
        /// <param name="mapper"></param>
        /// <param name="encryptionService"></param>
        /// <param name="dateAdapter"></param>
        /// <param name="whiteLabelSettings"></param>
        /// <param name="logger"></param>
        public QuoteController(
            IAddressClient addressClient,
            IVehicleClient vehicleClient,
            IDxpClient dxpClient,
            ICustomerNumberService customerNumberService,
            IMapper mapper,
            IEncryptionService encryptionService,
            IDateTime dateAdapter,
            WhiteLabelSettings whiteLabelSettings,
            Tower.Core.Logging.ILogger<QuoteController> logger)
        {
            _addressClient = addressClient ?? throw new ArgumentNullException(nameof(addressClient));
            _vehicleClient = vehicleClient ?? throw new ArgumentNullException(nameof(vehicleClient));
            _dxpClient = dxpClient ?? throw new ArgumentNullException(nameof(dxpClient));
            _customerNumberService =
                customerNumberService ?? throw new ArgumentNullException(nameof(customerNumberService));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
            _encryptionService = encryptionService ?? throw new ArgumentNullException(nameof(encryptionService));
            _dateAdapter = dateAdapter ?? throw new ArgumentNullException(nameof(dateAdapter));
            _whiteLabelSettings = whiteLabelSettings ?? throw new ArgumentNullException(nameof(whiteLabelSettings));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Updates a quote for a motor policy.
        /// </summary>
        /// <param name="request">Details of the quote to be updated.</param>
        /// <param name="policyNumberRequest">Identifies the quote to update.</param>
        /// <param name="correlationId"></param>
        [HttpPut("motor/{PolicyNumber}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(MotorQuote))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<MotorQuote>> UpdateMotor([FromBody] MotorQuote request,
            [FromRoute] PolicyNumberRequest policyNumberRequest,
            [FromHeader(Name = XCorrelationId)] string correlationId)
        {
            try
            {
                var customerNumberTask = _customerNumberService.DeriveCustomerNumber(User,
                    _encryptionService.DecryptString(request.CustomerNumber, true), correlationId);

                var policyNumber = DecryptPolicyNumber(policyNumberRequest.PolicyNumber);
                var autoQuote = _mapper.Map<PrecAuQuote>(request);

                ValidatePolicyStartDateForTMI(request.AgencyCode, autoQuote.EffectiveDate);

                await SetVehicleCharacteristics(autoQuote, correlationId);
                await SetAddressCharacteristics(autoQuote, correlationId);

                var updateQuoteResponse = await _dxpClient.UpdateQuoteV2(policyNumber, autoQuote,
                    await customerNumberTask, correlationId, _whiteLabelSettings.Brand.Name);

                var response = _mapper.Map<MotorQuote>(updateQuoteResponse);
                return Ok(response);
            }
            catch (CustomerNumberException)
            {
                return Forbid();
            }
            catch (InvalidEffectiveDateException e)
            {
                return BadRequest(e.Message);
            }
            catch (Exception e) when (e.InnerException is EncryptionException || e is EncryptionException)
            {
                return NotFound("Invalid PolicyNumber or CustomerNumber.");
            }
            catch (VehicleDetailsMismatchException e)
            {
                return BadRequest(e.Message);
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.UnprocessableEntity)
            {
                return UnprocessableEntity(e.Content);
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound();
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.Forbidden)
            {
                return Forbid();
            }
            catch (ApiException e)
            {
                _logger.LogError($"Error response from API ({e.Uri}).", e.Content);
                throw;
            }
        }

        /// <summary>
        /// Updates a quote for a home policy.
        /// </summary>
        /// <param name="request">Details of the quote to be updated.</param>
        /// <param name="policyNumberRequest">Identifies the quote to update.</param>
        /// <param name="correlationId"></param>
        [HttpPut("home/{PolicyNumber}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(HomeQuote))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<HomeQuote>> UpdateHome([FromBody] HomeQuote request,
            [FromRoute] PolicyNumberRequest policyNumberRequest,
            [FromHeader(Name = XCorrelationId)] string correlationId)
        {
            try
            {
                var customerNumberTask = _customerNumberService.DeriveCustomerNumber(User,
                    _encryptionService.DecryptString(request.CustomerNumber, true), correlationId);

                var policyNumber = DecryptPolicyNumber(policyNumberRequest.PolicyNumber);
                var homeQuote = _mapper.Map<TwrHoQuote>(request);

                ValidatePolicyStartDateForTMI(request.AgencyCode, homeQuote.EffectiveDate);

                await SetAddressCharacteristics(homeQuote, correlationId);

                var updateQuoteResponse = await _dxpClient.UpdateQuoteV2(policyNumber, homeQuote,
                    await customerNumberTask, correlationId, _whiteLabelSettings.Brand.Name);

                var response = _mapper.Map<HomeQuote>(updateQuoteResponse);
                return Ok(response);
            }
            catch (CustomerNumberException)
            {
                return Forbid();
            }
            catch (InvalidEffectiveDateException)
            {
                return Forbid();
            }
            catch (Exception e) when (e.InnerException is EncryptionException || e is EncryptionException)
            {
                return NotFound("Invalid PolicyNumber or CustomerNumber.");
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.UnprocessableEntity)
            {
                return UnprocessableEntity(e.Content);
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound();
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.Forbidden)
            {
                return Forbid();
            }
            catch (ApiException e)
            {
                _logger.LogError($"Error response from API ({e.Uri}).", e.Content);
                throw;
            }
        }

        /// <summary>
        /// Retrieves an existing motor quote.
        /// </summary>
        /// <param name="request">Identifies the quote to retrieve.</param>
        /// <param name="correlationId"></param>
        [HttpGet("motor/{PolicyNumber}", Name = nameof(GetMotor))]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(MotorQuote))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<MotorQuote>> GetMotor([FromRoute] PolicyNumberRequest request,
            [FromHeader(Name = XCorrelationId)] string correlationId)
        {
            try
            {
                var policyNumber = DecryptPolicyNumber(request.PolicyNumber);
                var dxpResponse =
                    await _dxpClient.GetAutoQuoteV2(policyNumber, correlationId, _whiteLabelSettings.Brand.Name);

                if (await CustomerAccessAllowed(dxpResponse.CustomerNumber, correlationId))
                    return Ok(_mapper.Map<MotorQuote>(dxpResponse));

                return Forbid();
            }
            catch (CustomerNumberException)
            {
                return Forbid();
            }
            catch (EncryptionException)
            {
                return NotFound("Invalid PolicyNumber.");
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound();
            }
            catch (ApiException e)
            {
                _logger.LogError($"Error response from API ({e.Uri}).", e.Content);
                throw;
            }
        }

        /// <summary>
        /// Retrieves an existing home quote.
        /// </summary>
        /// <param name="request">Identifies the quote to retrieve.</param>
        /// <param name="correlationId"></param>
        [HttpGet("home/{PolicyNumber}", Name = nameof(GetHome))]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(HomeQuote))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<HomeQuote>> GetHome([FromRoute] PolicyNumberRequest request,
            [FromHeader(Name = XCorrelationId)] string correlationId)
        {
            try
            {
                var policyNumber = DecryptPolicyNumber(request.PolicyNumber);
                var dxpResponse =
                    await _dxpClient.GetHomeQuoteV2(policyNumber, correlationId, _whiteLabelSettings.Brand.Name);

                if (await CustomerAccessAllowed(dxpResponse.CustomerNumber, correlationId))
                    return Ok(_mapper.Map<HomeQuote>(dxpResponse));

                return Forbid();
            }
            catch (CustomerNumberException)
            {
                return Forbid();
            }
            catch (EncryptionException)
            {
                return NotFound("Invalid PolicyNumber.");
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound();
            }
            catch (ApiException e)
            {
                _logger.LogError($"Error response from API ({e.Uri}).", e.Content);
                throw;
            }
        }

        /// <summary>
        /// Get the rating variations for a motor quote.
        /// </summary>
        /// <param name="request">Details of the quote to be rated.</param>
        /// <param name="correlationId"></param>
        [HttpPost("motor/rate")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(List<MotorRateQuoteResponse>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<List<MotorRateQuoteResponse>>> RateMotor(MotorQuote request,
            [FromHeader(Name = XCorrelationId)] string correlationId)
        {
            try
            {
                var autoQuote = _mapper.Map<PrecAuQuote>(request);

                await SetVehicleCharacteristics(autoQuote, correlationId);
                await SetAddressCharacteristics(autoQuote, correlationId);

                var dxpResponse =
                    await _dxpClient.QuickRateQuoteV2(autoQuote, correlationId, _whiteLabelSettings.Brand.Name);

                var response = _mapper.Map<List<MotorRateQuoteResponse>>(dxpResponse);
                return Ok(response);
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.UnprocessableEntity)
            {
                return UnprocessableEntity(e.Content);
            }
            catch (ApiException e)
            {
                _logger.LogError($"Error response from API ({e.Uri}).", e.Content);
                throw;
            }
        }

        /// <summary>
        /// Get the rating variations for a home quote.
        /// </summary>
        /// <param name="request">Details of the quote to be rated.</param>
        /// <param name="correlationId"></param>
        [HttpPost("home/rate")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(List<HomeRateQuoteResponse>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<List<HomeRateQuoteResponse>>> RateHome(HomeQuote request,
            [FromHeader(Name = XCorrelationId)] string correlationId)
        {
            try
            {
                var homeQuote = _mapper.Map<TwrHoQuote>(request);

                await SetAddressCharacteristics(homeQuote, correlationId);

                var dxpResponse =
                    await _dxpClient.QuickRateQuoteV2(homeQuote, correlationId, _whiteLabelSettings.Brand.Name);

                var response = _mapper.Map<List<HomeRateQuoteResponse>>(dxpResponse);
                return Ok(response);
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.UnprocessableEntity)
            {
                return UnprocessableEntity(e.Content);
            }
            catch (ApiException e)
            {
                _logger.LogError($"Error response from API ({e.Uri}).", e.Content);
                throw;
            }
        }

        /// <summary>
        /// Validate underwriting rules for a motor quote.
        /// </summary>
        /// <param name="request">Details of the quote to be validated.</param>
        /// <param name="correlationId"></param>
        [HttpPost("motor/underwrite")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(List<UnderwriteResponse>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<List<UnderwriteResponse>>> UnderwriteMotor(MotorQuote request,
            [FromHeader(Name = XCorrelationId)] string correlationId)
        {
            try
            {
                if (string.IsNullOrEmpty(request.PolicyNumber))
                {
                    return BadRequest("PolicyNumber is required.");
                }

                var policyNumber = DecryptPolicyNumber(request.PolicyNumber);
                var autoQuote = _mapper.Map<PrecAuQuote>(request);

                ValidatePolicyStartDateForTMI(request.AgencyCode, autoQuote.EffectiveDate);

                await SetVehicleCharacteristics(autoQuote, correlationId);
                await SetAddressCharacteristics(autoQuote, correlationId);

                var dxpResponse = await _dxpClient.ValidateUnderwritingRulesV2(policyNumber, autoQuote, correlationId,
                    _whiteLabelSettings.Brand.Name);

                var response = _mapper.Map<List<UnderwriteResponse>>(dxpResponse);
                return Ok(response);
            }
            catch (EncryptionException)
            {
                return NotFound("Invalid PolicyNumber.");
            }
            catch (InvalidEffectiveDateException)
            {
                return Forbid();
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.UnprocessableEntity)
            {
                return UnprocessableEntity(e.Content);
            }
            catch (ApiException e)
            {
                _logger.LogError($"Error response from API ({e.Uri}).", e.Content);
                throw;
            }
        }

        /// <summary>
        /// Validate underwriting rules for a home quote.
        /// </summary>
        /// <param name="request">Details of the quote to be validated.</param>
        /// <param name="correlationId"></param>
        [HttpPost("home/underwrite")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(List<UnderwriteResponse>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<List<UnderwriteResponse>>> UnderwriteHome(HomeQuote request,
            [FromHeader(Name = XCorrelationId)] string correlationId)
        {
            try
            {
                if (string.IsNullOrEmpty(request.PolicyNumber))
                {
                    return BadRequest("PolicyNumber is required.");
                }

                var policyNumber = DecryptPolicyNumber(request.PolicyNumber);
                var homeQuote = _mapper.Map<TwrHoQuote>(request);

                ValidatePolicyStartDateForTMI(request.AgencyCode, homeQuote.EffectiveDate);

                await SetAddressCharacteristics(homeQuote, correlationId);

                var dxpResponse = await _dxpClient.ValidateUnderwritingRulesV2(policyNumber, homeQuote, correlationId,
                    _whiteLabelSettings.Brand.Name);

                var response = _mapper.Map<List<UnderwriteResponse>>(dxpResponse);
                return Ok(response);
            }
            catch (EncryptionException)
            {
                return NotFound("Invalid PolicyNumber.");
            }
            catch (InvalidEffectiveDateException)
            {
                return Forbid();
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.UnprocessableEntity)
            {
                return UnprocessableEntity(e.Content);
            }
            catch (ApiException e)
            {
                _logger.LogError($"Error response from API ({e.Uri}).", e.Content);
                throw;
            }
        }

        /// <summary>
        /// Prepares a motor quote for purchase:
        /// updates it, sets it to "rated", and returns both annual and estimated non-annual rates.
        /// </summary>
        /// <param name="requestRoute">Identifies the quote.</param>
        /// <param name="request"></param>
        /// <param name="correlationId"></param>
        [HttpPut("motor/{PolicyNumber}/prepare")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PrepareQuoteResponse))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<PrepareQuoteResponse>> PrepareMotor(
            [FromRoute] PolicyNumberRequest requestRoute,
            [FromBody] MotorQuote request,
            [FromHeader(Name = XCorrelationId)] string correlationId)
        {
            try
            {
                var customerNumberTask = _customerNumberService.DeriveCustomerNumber(User,
                    _encryptionService.DecryptString(request.CustomerNumber, true), correlationId);

                var policyNumber = DecryptPolicyNumber(requestRoute.PolicyNumber);
                var autoQuote = _mapper.Map<PrecAuQuote>(request);

                await SetVehicleCharacteristics(autoQuote, correlationId);
                await SetAddressCharacteristics(autoQuote, correlationId);

                var response = await _dxpClient.UpdateAndRateQuoteV2(policyNumber, autoQuote, await customerNumberTask,
                    correlationId, _whiteLabelSettings.Brand.Name);
                return Ok(_mapper.Map<PrepareQuoteResponse>(response));
            }
            catch (CustomerNumberException)
            {
                return Forbid();
            }
            catch (Exception e) when (e.InnerException is EncryptionException || e is EncryptionException)
            {
                return NotFound("Invalid PolicyNumber or CustomerNumber.");
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.UnprocessableEntity)
            {
                return UnprocessableEntity(e.Content);
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound();
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.Forbidden)
            {
                return Forbid();
            }
            catch (ApiException e)
            {
                _logger.LogError($"Error response from API ({e.Uri}).", e.Content);
                throw;
            }
        }

        /// <summary>
        /// Prepares a home quote for purchase:
        /// updates it, sets it to "rated", and returns both annual and estimated non-annual rates.
        /// </summary>
        /// <param name="requestRoute">Identifies the quote.</param>
        /// <param name="request"></param>
        /// <param name="correlationId"></param>
        [HttpPut("home/{PolicyNumber}/prepare")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PrepareQuoteResponse))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<PrepareQuoteResponse>> PrepareHome(
            [FromRoute] PolicyNumberRequest requestRoute,
            [FromBody] HomeQuote request,
            [FromHeader(Name = XCorrelationId)] string correlationId)
        {
            try
            {
                var customerNumberTask = _customerNumberService.DeriveCustomerNumber(User,
                    _encryptionService.DecryptString(request.CustomerNumber, true), correlationId);

                var policyNumber = DecryptPolicyNumber(requestRoute.PolicyNumber);
                var homeQuote = _mapper.Map<TwrHoQuote>(request);

                await SetAddressCharacteristics(homeQuote, correlationId);

                var response = await _dxpClient.UpdateAndRateQuoteV2(policyNumber, homeQuote, await customerNumberTask,
                    correlationId, _whiteLabelSettings.Brand.Name);
                return Ok(_mapper.Map<PrepareQuoteResponse>(response));
            }
            catch (CustomerNumberException)
            {
                return Forbid();
            }
            catch (Exception e) when (e.InnerException is EncryptionException || e is EncryptionException)
            {
                return NotFound("Invalid PolicyNumber or CustomerNumber.");
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.UnprocessableEntity)
            {
                return UnprocessableEntity(e.Content);
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound();
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.Forbidden)
            {
                return Forbid();
            }
            catch (ApiException e)
            {
                _logger.LogError($"Error response from API ({e.Uri}).", e.Content);
                throw;
            }
        }

        /// <summary>
        /// Updates the PolicyCount property of the specified quote.
        /// </summary>
        /// <param name="requestRoute">Identifies the quote.</param>
        /// <param name="request"></param>
        /// <param name="correlationId"></param>
        [HttpPut("{Product}/{PolicyNumber}/policy-count")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PolicyResponse))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<PolicyResponse>> UpdatePolicyCount(
            [FromRoute] PolicyRequestRoute requestRoute,
            [FromBody] UpdatePolicyCountRequest request,
            [FromHeader(Name = XCorrelationId)] string correlationId)
        {
            try
            {
                string policyNumber = DecryptPolicyNumber(requestRoute.PolicyNumber);
                TwrQuotePolicyCountUpdateRequest dxpRequest = _mapper.Map<TwrQuotePolicyCountUpdateRequest>(request);

                switch (requestRoute.Product)
                {
                    case ProductType.Motor:
                        {
                            var quote = await _dxpClient.GetAutoQuoteV2(policyNumber, correlationId,
                                _whiteLabelSettings.Brand.Name);

                            if (await CustomerAccessAllowed(quote.CustomerNumber, correlationId))
                            {
                                var dxpResponse = await _dxpClient.UpdateAutoQuotePolicyCount(policyNumber, dxpRequest,
                                    quote.CustomerNumber, correlationId, _whiteLabelSettings.Brand.Name);
                                return Ok(_mapper.Map<PolicyResponse>(dxpResponse));
                            }

                            break;
                        }
                    case ProductType.Home:
                        {
                            var quote = await _dxpClient.GetHomeQuoteV2(policyNumber, correlationId,
                                _whiteLabelSettings.Brand.Name);

                            if (await CustomerAccessAllowed(quote.CustomerNumber, correlationId))
                            {
                                var dxpResponse = await _dxpClient.UpdateHomeQuotePolicyCount(policyNumber, dxpRequest,
                                    quote.CustomerNumber, correlationId, _whiteLabelSettings.Brand.Name);
                                return Ok(_mapper.Map<PolicyResponse>(dxpResponse));
                            }

                            break;
                        }
                    default:
                        {
                            return UnprocessableEntity($"Update policy count for {requestRoute.Product} is not supported.");
                        }
                }

                return Forbid();
            }
            catch (CustomerNumberException)
            {
                return Forbid();
            }
            catch (EncryptionException)
            {
                return NotFound("Invalid PolicyNumber.");
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.UnprocessableEntity)
            {
                return UnprocessableEntity(e.Content);
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound();
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.Forbidden)
            {
                return Forbid();
            }
            catch (ApiException e)
            {
                _logger.LogError($"Error response from API ({e.Uri}).", e.Content);
                throw;
            }
        }

        /// <summary>
        /// Updates the PaymentDetails of the specified quote.
        /// </summary>
        /// <param name="requestRoute">Identifies the quote.</param>
        /// <param name="request"></param>
        /// <param name="correlationId"></param>
        [HttpPut("{Product}/{PolicyNumber}/payment-details")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PolicyResponse))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<PolicyResponse>> UpdatePaymentDetails(
            [FromRoute] PolicyRequestRoute requestRoute,
            [FromBody] UpdatePaymentDetailsRequest request,
            [FromHeader(Name = XCorrelationId)] string correlationId)
        {
            try
            {
                var policyNumber = DecryptPolicyNumber(requestRoute.PolicyNumber);

                switch (requestRoute.Product)
                {
                    case ProductType.Motor:
                        {
                            // Note: the DXP GetAutoQuoteDigitalBlob ignores transactionEffectiveDate & version,
                            // so calling GetHomeQuote, which doesn't take these parameters and returns the CustomerNumber 
                            // we need for authorisation is acceptable.
                            var quote = await _dxpClient.GetAutoQuoteV2(policyNumber, correlationId,
                                _whiteLabelSettings.Brand.Name);

                            if (await CustomerAccessAllowed(quote.CustomerNumber, correlationId))
                            {
                                var digitalBlobData =
                                    _mapper.Map<TwrQuoteDigitalBlobUpdateRequest>(quote);
                                digitalBlobData.DigitalBlob =
                                    DigitalBlobHelper.AddPaymentDetails(digitalBlobData.DigitalBlob,
                                        request.PaymentDetails);

                                var clientResponse = await _dxpClient.UpdateAutoQuoteDigitalBlob(policyNumber,
                                    digitalBlobData, quote.CustomerNumber, correlationId, _whiteLabelSettings.Brand.Name);
                                return Ok(_mapper.Map<PolicyResponse>(clientResponse));
                            }

                            break;
                        }
                    case ProductType.Home:
                        {
                            // Note: the DXP GetHomeQuoteDigitalBlob ignores transactionEffectiveDate & version,
                            // so calling GetHomeQuote, which doesn't take these parameters and returns the CustomerNumber 
                            // we need for authorisation is acceptable.
                            var quote = await _dxpClient.GetHomeQuoteV2(policyNumber, correlationId,
                                _whiteLabelSettings.Brand.Name);

                            if (await CustomerAccessAllowed(quote.CustomerNumber, correlationId))
                            {
                                var digitalBlobData =
                                    _mapper.Map<TwrQuoteDigitalBlobUpdateRequest>(quote);
                                digitalBlobData.DigitalBlob =
                                    DigitalBlobHelper.AddPaymentDetails(digitalBlobData.DigitalBlob,
                                        request.PaymentDetails);

                                var clientResponse = await _dxpClient.UpdateHomeQuoteDigitalBlob(policyNumber,
                                    digitalBlobData, quote.CustomerNumber, correlationId, _whiteLabelSettings.Brand.Name);
                                return Ok(_mapper.Map<PolicyResponse>(clientResponse));
                            }

                            break;
                        }
                    default:
                        {
                            return UnprocessableEntity(
                                $"Update payment details for {requestRoute.Product} is not supported.");
                        }
                }

                return Forbid();
            }
            catch (CustomerNumberException)
            {
                return Forbid();
            }
            catch (EncryptionException)
            {
                return NotFound("Invalid PolicyNumber.");
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.UnprocessableEntity)
            {
                return UnprocessableEntity(e.Content);
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound();
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.Forbidden)
            {
                return Forbid();
            }
            catch (ApiException e)
            {
                _logger.LogError($"Error response from API ({e.Uri}).", e.Content);
                throw;
            }
        }

        /// <summary>
        /// Updates the PaymentPlan property of the specified quote, and updates it to "rated" status.
        /// </summary>
        /// <param name="requestRoute">Identifies the quote.</param>
        /// <param name="request"></param>
        /// <param name="correlationId"></param>
        [HttpPost("{Product}/{PolicyNumber}/payment-plan")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PrepareQuoteResponse))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<PrepareQuoteResponse>> UpdatePaymentPlan(
            [FromRoute] PolicyRequestRoute requestRoute,
            [FromBody] UpdatePaymentPlanRequest request,
            [FromHeader(Name = XCorrelationId)] string correlationId)
        {
            try
            {
                var policyNumber = DecryptPolicyNumber(requestRoute.PolicyNumber);
                var clientRequest =
                    _mapper.Map<TwrQuotePaymentPlanUpdateRateRequest>(request);

                switch (requestRoute.Product)
                {
                    case ProductType.Motor:
                        {
                            var quote = await _dxpClient.GetAutoQuoteV2(policyNumber, correlationId,
                                _whiteLabelSettings.Brand.Name);

                            if (await CustomerAccessAllowed(quote.CustomerNumber, correlationId))
                            {
                                var dxpResponse = await _dxpClient.UpdateAutoQuotePaymentPlan(policyNumber, clientRequest,
                                    quote.CustomerNumber, correlationId, _whiteLabelSettings.Brand.Name);
                                return Ok(_mapper.Map<PrepareQuoteResponse>(dxpResponse));
                            }

                            break;
                        }
                    case ProductType.Home:
                        {
                            var quote = await _dxpClient.GetHomeQuoteV2(policyNumber, correlationId,
                                _whiteLabelSettings.Brand.Name);

                            if (await CustomerAccessAllowed(quote.CustomerNumber, correlationId))
                            {
                                var dxpResponse = await _dxpClient.UpdateHomeQuotePaymentPlan(policyNumber, clientRequest,
                                    quote.CustomerNumber, correlationId, _whiteLabelSettings.Brand.Name);
                                return Ok(_mapper.Map<PrepareQuoteResponse>(dxpResponse));
                            }

                            break;
                        }
                    default:
                        {
                            return UnprocessableEntity($"Update payment plan for {requestRoute.Product} is not supported.");
                        }
                }

                return Forbid();
            }
            catch (CustomerNumberException)
            {
                return Forbid();
            }
            catch (EncryptionException)
            {
                return NotFound("Invalid PolicyNumber.");
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.UnprocessableEntity)
            {
                return UnprocessableEntity(e.Content);
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound();
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.Forbidden)
            {
                return Forbid();
            }
            catch (ApiException e)
            {
                _logger.LogError($"Error response from API ({e.Uri}).", e.Content);
                throw;
            }
        }

        /// <summary>
        /// Retrieves the instalment breakdown for the quote.
        /// </summary>
        /// <param name="requestRoute">Identifies the quote.</param>
        /// <param name="requestQuery">Specifies payment frequency and start date.</param>
        /// <param name="correlationId"></param>
        [HttpGet("{PolicyNumber}/instalments")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(List<GetInstalmentScheduleResponse>))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<List<GetInstalmentScheduleResponse>>> GetInstalmentSchedule(
            [FromRoute] PolicyNumberRequest requestRoute,
            [FromQuery] GetInstalmentScheduleRequest requestQuery,
            [FromHeader(Name = XCorrelationId)] string correlationId)
        {
            try
            {
                DateTime? firstPaymentDate = null;
                if (DateTime.TryParseExact(requestQuery.FirstPaymentDate, "yyyy-MM-dd", new DateTimeFormatInfo(),
                    DateTimeStyles.None, out var result))
                {
                    firstPaymentDate = result;
                }

                var policyNumber = DecryptPolicyNumber(requestRoute.PolicyNumber);
                var clientRequest = new TwrInstallmentScheduleRequest
                {
                    PlanCd = Tower.Core.Models.Payment.Mapping.PlanMap.ToDxp(requestQuery.Plan),
                    FirstPaymentDate = firstPaymentDate,
                    PaymentDayOfMonth = requestQuery.PaymentDayOfMonth,
                    DownPaymentAmount = new QuickQuoteMoney { CurrencyCd = "NZD" }
                };

                var clientResponse = await _dxpClient.GetInstalmentSchedule(policyNumber, clientRequest, correlationId,
                    _whiteLabelSettings.Brand.Name);
                return Ok(_mapper.Map<List<GetInstalmentScheduleResponse>>(clientResponse));
            }
            catch (EncryptionException)
            {
                return NotFound("Invalid PolicyNumber.");
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.UnprocessableEntity)
            {
                // eg, could be because quote is not rated.
                return UnprocessableEntity(e.Content);
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound();
            }
            catch (ApiException e)
            {
                _logger.LogError($"Error response from API ({e.Uri}).", e.Content);
                throw;
            }
        }

        /// <summary>
        /// Provide motor policy wording URLs
        /// </summary>
        [HttpGet("motor/{PolicyNumber}/policy-wording")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(List<MotorPolicyWordingURLResponse>))]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(List<MotorPolicyWordingURLResponse>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        public async Task<ActionResult<List<MotorPolicyWordingURLResponse>>> GetMotorPolicyWordingURLs(
            [FromRoute] PolicyNumberRequest requestRoute,
            [FromHeader(Name = XCorrelationId)] string correlationId)
        {
            string? policyNumber = null;

            try
            {
                policyNumber = DecryptPolicyNumber(requestRoute.PolicyNumber);
                string quoteCustomerNumber;

                var quote = await _dxpClient.GetAutoQuoteV2(policyNumber, correlationId,
                    _whiteLabelSettings.Brand.Name);
                quoteCustomerNumber = quote.CustomerNumber;

                var response = await _dxpClient.GetPolicyWordingURLs(policyNumber, quoteCustomerNumber, correlationId, _whiteLabelSettings.Brand.Name);

                if (response == null)
                {
                    _logger.LogError("response is null");
                    return UnprocessableEntity();
                };

                return Ok(_mapper.Map<List<MotorPolicyWordingURLResponse>>(response));

            }
            catch (EncryptionException)
            {
                _logger.LogError($"Invalid PolicyNumber: {policyNumber}.");
                return NotFound("Invalid PolicyNumber.");
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.UnprocessableEntity)
            {
                _logger.LogError(e.Content);
                return UnprocessableEntity();
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound();
            }
            catch (ApiException e)
            {
                _logger.LogError($"Error response from API ({e.Uri}).", e.Content);
                throw;
            }
        }

        /// <summary>
        /// Provide home policy wording URLs
        /// </summary>
        [HttpGet("home/{PolicyNumber}/policy-wording")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(List<MotorPolicyWordingURLResponse>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        public async Task<ActionResult<List<MotorPolicyWordingURLResponse>>> GetHomePolicyWordingURLs(
            [FromRoute] PolicyNumberRequest requestRoute,
            [FromHeader(Name = XCorrelationId)] string correlationId)
        {
            string? policyNumber = null;

            try
            {
                policyNumber = DecryptPolicyNumber(requestRoute.PolicyNumber);
                string quoteCustomerNumber;

                var quote = await _dxpClient.GetHomeQuoteV2(policyNumber, correlationId,
                    _whiteLabelSettings.Brand.Name);
                quoteCustomerNumber = quote.CustomerNumber;

                var response = await _dxpClient.GetPolicyWordingURLs(policyNumber, quoteCustomerNumber, correlationId, _whiteLabelSettings.Brand.Name);

                if (response == null)
                {
                    _logger.LogError("response is null");
                    return UnprocessableEntity();
                };

                return Ok(_mapper.Map<List<HomePolicyWordingURLResponse>>(response));

            }
            catch (EncryptionException)
            {
                _logger.LogError($"Invalid PolicyNumber: {policyNumber}.");
                return NotFound("Invalid PolicyNumber.");
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.UnprocessableEntity)
            {
                _logger.LogError(e.Content);
                return UnprocessableEntity();
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound();
            }
            catch (ApiException e)
            {
                _logger.LogError($"Error response from API ({e.Uri}).", e.Content);
                throw;
            }
        }

        /// <summary>
        /// Deletes the specified quote.
        /// </summary>
        /// <param name="requestRoute">Identifies the quote.</param>
        /// <param name="correlationId"></param>
        [HttpDelete("{Product}/{PolicyNumber}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        public async Task<ActionResult> DeleteQuote(
            [FromRoute] PolicyRequestRoute requestRoute,
            [FromHeader(Name = XCorrelationId)] string correlationId)
        {
            try
            {
                var policyNumber = DecryptPolicyNumber(requestRoute.PolicyNumber);

                long? quoteBundleId;
                string quoteCustomerNumber;
                DateTime? quoteEffectiveDate;
                switch (requestRoute.Product)
                {
                    case ProductType.Motor:
                        {
                            var quote = await _dxpClient.GetAutoQuoteV2(policyNumber, correlationId,
                                _whiteLabelSettings.Brand.Name);
                            quoteCustomerNumber = quote.CustomerNumber;
                            quoteBundleId = quote.BundleId;
                            quoteEffectiveDate = quote.EffectiveDate;
                            break;
                        }
                    case ProductType.Home:
                        {
                            var quote = await _dxpClient.GetHomeQuoteV2(policyNumber, correlationId,
                                _whiteLabelSettings.Brand.Name);
                            quoteCustomerNumber = quote.CustomerNumber;
                            quoteBundleId = quote.BundleId;
                            quoteEffectiveDate = quote.EffectiveDate;
                            break;
                        }
                    default:
                        {
                            _logger.LogError($"Delete quote for {requestRoute.Product} is not supported.");
                            return UnprocessableEntity();
                        }
                }

                if (!await CustomerAccessAllowed(quoteCustomerNumber, correlationId))
                    return Forbid();

                await _dxpClient.DeclineQuote(
                    new TwrDeclineQuoteRequest
                    {
                        DeclineDate = quoteEffectiveDate.GetValueOrDefault(),
                        DeclineReasonCd = "OTH",
                        OtherReason = "Digital"
                    },
                    policyNumber,
                    correlationId,
                    _whiteLabelSettings.Brand.Name);

                if (quoteBundleId.HasValue)
                {
                    await _dxpClient.RemoveQuoteFromBundle(quoteBundleId.Value, policyNumber, correlationId,
                        _whiteLabelSettings.Brand.Name);
                }

                return Ok();
            }
            catch (CustomerNumberException)
            {
                return Forbid();
            }
            catch (EncryptionException)
            {
                _logger.LogError("Invalid PolicyNumber.");
                return NotFound();
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.UnprocessableEntity)
            {
                _logger.LogError(e.Content);
                return UnprocessableEntity();
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound();
            }
            catch (ApiException e)
            {
                _logger.LogError($"Error response from API ({e.Uri}).", e.Content);
                throw;
            }
        }

        internal async Task SetVehicleCharacteristics(PrecAuQuote policyAuto,
            string correlationId)
        {
            var inputVehicle = policyAuto.Vehicles?.FirstOrDefault();

            if (inputVehicle?.RedbookReference != null)
            {
                if (inputVehicle.VehicleBlob != null &&
                    inputVehicle.VehicleBlob.TryGetValue("Id", out var blobRedbookReference) &&
                    blobRedbookReference as string == inputVehicle.RedbookReference &&
                    inputVehicle.VehicleBlob.TryGetValue("RiskFlags", out var hotListFlagsObject) &&
                    inputVehicle.VehicleBlob.TryGetValue("Min", out var agreedValueMin) &&
                    inputVehicle.VehicleBlob.TryGetValue("Max", out var agreedValueMax) &&
                    inputVehicle.VehicleBlob.TryGetValue("VehVal", out var vehVal))
                {
                    // The existing VehicleBlob is for this RedbookReference, so use hotlist flags from there.
                    var hotListFlags = JObject.FromObject(hotListFlagsObject)
                        .ToObject<HttpClients.Models.Vehicle.VehicleHotlistFlags>();
                    inputVehicle.HotListFlags = _mapper.Map<TwrPrecAuVehicleRiskFlag>(hotListFlags);
                    inputVehicle.AgreedValueMin = Convert.ToDecimal(agreedValueMin);
                    inputVehicle.AgreedValueMax = Convert.ToDecimal(agreedValueMax);
                    inputVehicle.MarketValue = Convert.ToDecimal(vehVal);
                    return;
                }

                try
                {
                    // Mismatched RedbookReference, or no HotListFlags in VehicleBlob, so get it again.
                    var tslVehicle =
                        await _vehicleClient.GetVehicleByRedbookReference(inputVehicle.RedbookReference, correlationId);

                    inputVehicle.VehicleBlob = GetDictionary(tslVehicle.Characteristics);
                    inputVehicle.HotListFlags =
                        _mapper.Map<TwrPrecAuVehicleRiskFlag>(tslVehicle.HotlistFlags);
                    inputVehicle.AgreedValueMin = tslVehicle.AgreedValueMin;
                    inputVehicle.AgreedValueMax = tslVehicle.AgreedValueMax;
                    inputVehicle.MarketValue = tslVehicle.DefaultValue;

                    policyAuto.RiskCharacteristicsUpdateDate = _dateAdapter.UtcNow;
                }
                catch (ApiException e)
                {
                    _logger.LogError("Error response from TSL", e.Content);
                    throw;
                }
            }
        }

        internal async Task SetAddressCharacteristics(TwrHoQuote policyHome, string correlationId)
        {
            var riskAddress = policyHome.RiskItems?.FirstOrDefault()?.RiskAddress;

            var characteristics = await SetAddressCharacteristics(riskAddress, correlationId);
            if (riskAddress != null && characteristics != null)
            {
                riskAddress.GeographicBlob = characteristics;
                policyHome.RiskCharacteristicsUpdateDate = _dateAdapter.UtcNow;
            }
        }

        internal async Task SetAddressCharacteristics(PrecAuQuote policyAuto, string correlationId)
        {
            var vehicleAddress = policyAuto.Vehicles?.FirstOrDefault()?.ParkingAddress;

            var characteristics = await SetAddressCharacteristics(vehicleAddress, correlationId);
            if (vehicleAddress != null && characteristics != null)
            {
                vehicleAddress.GeographicBlob = characteristics;
                policyAuto.RiskCharacteristicsUpdateDate = _dateAdapter.UtcNow;
            }
        }

        private async Task<Dictionary<string, object>?> SetAddressCharacteristics(
            IRiskAddress? inputAddress, string correlationId)
        {
            if (inputAddress == null || !long.TryParse(inputAddress.AddressReference, out var addressReference))
            {
                // No AddressReference specified
                return null;
            }

            if (inputAddress.GeographicBlob != null &&
                inputAddress.GeographicBlob.TryGetValue("id", out var blobAddressReference) &&
                blobAddressReference as long? == addressReference)
            {
                // The existing GeographicBlob is for this AddressReference, so do not update it.
                return null;
            }

            try
            {
                Dictionary<string, object>? characteristics;

                if (addressReference < 0)
                {                    
                    var tslStreetDetails = await _addressClient.GetStreetDetails(inputAddress.PostalCode!,
                    inputAddress.AddressLine1!, correlationId);
                    characteristics = GetDictionary(tslStreetDetails.Characteristics);
                }
                else
                {                    
                    var addressDetails = await _addressClient.GetAddressDetails(addressReference, correlationId);
                    characteristics = GetDictionary(addressDetails.Characteristics);
                }

                return characteristics;
            }
            catch (ApiException e) when (e.StatusCode == HttpStatusCode.NotFound)
            {
                _logger.LogWarning($"NotFound result from TSL for {addressReference}");
                return null;
            }
            catch (ApiException e)
            {
                _logger.LogError("Error response from TSL.", e.Content);
                throw;
            }
        }

        private async Task<bool> CustomerAccessAllowed(string quoteCustomerNumber, string correlationId)
        {
            if (quoteCustomerNumber !=
                await _customerNumberService.DeriveCustomerNumber(User, quoteCustomerNumber, correlationId))
            {
                _logger.LogInformation("Forbidden: quote is not anonymous, and is not under authenticated customer.");
                return false;
            }

            return true;
        }

        private Dictionary<string, object>? GetDictionary(object? blob)
        {
            if (blob == null)
            {
                return null;
            }

            Dictionary<string, object>? characteristics = null;

            try
            {
                var blobString = blob?.ToString();
                if (!string.IsNullOrEmpty(blobString))
                {
                    characteristics = JsonConvert.DeserializeObject<Dictionary<string, object>>(blobString);
                }
            }
            catch (JsonReaderException ex)
            {
                _logger.LogError(ex, "Unable to deserialize characteristics.");
            }

            if (characteristics != null)
            {
                return characteristics;
            }

            throw new Exception("Unable to deserialize characteristics.");
        }

        private string DecryptPolicyNumber(string? encryptedPolicyNumber)
        {
            var policyNumber = _encryptionService.DecryptString(encryptedPolicyNumber, true);
            _logger.LogInformation($"Decrypted policyNumber {encryptedPolicyNumber} to {policyNumber}");
            return policyNumber;
        }

        private static readonly DateTime TMIEffectiveDateCutoff = new(2026, 12, 3);
        private void ValidatePolicyStartDateForTMI(string? brand, DateTime startDate)
        {
            if (brand == "TMI" && startDate >= TMIEffectiveDateCutoff)
            {
                throw new InvalidEffectiveDateException();
            }
        }
    }
}
