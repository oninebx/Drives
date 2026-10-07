using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Refit;
using Tower.Core.Encryption;
using Tower.Core.Middleware.WhiteLabelling.Models;
using Tower.Core.Models.Policy.Motor;
using Tower.Core.Models.Policy.Motor.Mapping;
using Tower.Digital.Policy.Exceptions;
using Tower.Digital.Policy.Models.Core;
using Tower.Digital.Policy.Models.Quote.V2;
using Xunit;

namespace Tower.Digital.Policy.Tests.Controllers.V2
{
    public partial class QuoteControllerTests
    {
        [Fact]
        public async Task UpdateMotor_WhenQuoteExists_Returns200()
        {
            const string correlationId = "correlationId";
            const string customerNumber = "customerNumber";
            const string policyNumber = "policyNumber";

            _customerNumberService
                .Setup(s => s.DeriveCustomerNumber(It.IsAny<ClaimsPrincipal>(), It.IsAny<string>(), correlationId))
                .Returns(Task.FromResult(customerNumber));

            _encryptionService
                .Setup(e => e.DecryptString(It.IsAny<string>(), true))
                .Returns<string, bool>((x, _) => x.Replace("encrypted", ""));

            _encryptionService
                .Setup(e => e.EncryptString(It.IsAny<string>(), true))
                .Returns<string, bool>((x, _) => $"encrypted{x}");

            _dxpClient
                .Setup(r => r.UpdateQuoteV2(policyNumber, It.IsAny<Tower.Core.Models.Dxp.PrecAuQuote>(), customerNumber, correlationId, BrandType.Tower.Name))
                .Returns(Task.FromResult(new Tower.Core.Models.Dxp.PrecAuQuote { PolicyNumber = policyNumber, TypeOfPolicyCd = MotorTypeOfPolicyMap.ToDxp(MotorTypeOfPolicy.Commercial)! }));

            _vehicleClient
                .Setup(c => c.GetVehicleByRedbookReference(It.IsAny<string>(), correlationId))
                .Returns(Task.FromResult(GetVehicleDetails()));

            _addressClient
                .Setup(c => c.GetAddressDetails(It.IsAny<long>(), correlationId))
                .Returns(Task.FromResult(new HttpClients.Models.Address.Address()));

            var result = await _quoteController.UpdateMotor(
                new MotorQuote { CustomerNumber = $"encrypted{customerNumber}" },
                new PolicyNumberRequest { PolicyNumber = $"encrypted{policyNumber}" },
                correlationId);

            _dxpClient.VerifyAll();

            var actionResult = result.Result as OkObjectResult;
            Assert.NotNull(actionResult);

            var actionValue = actionResult!.Value as MotorQuote;
            Assert.NotNull(actionValue);

            Assert.Equal($"encrypted{policyNumber}", actionValue!.PolicyNumber);
            Assert.Equal(MotorTypeOfPolicy.Commercial, actionValue.TypeOfPolicy);
        }

        [Theory]
        [InlineData(HttpStatusCode.NotFound, typeof(NotFoundResult))]
        [InlineData(HttpStatusCode.Forbidden, typeof(ForbidResult))]
        [InlineData(HttpStatusCode.UnprocessableEntity, typeof(UnprocessableEntityObjectResult))]
        public async Task UpdateMotor_WhenDxpReturnsErrorResult_ReturnsErrorResult(HttpStatusCode dxpResponse, Type expectedResultType)
        {
            const string correlationId = "correlationId";
            const string policyNumber = "policyNumber";

            _customerNumberService
                .Setup(s => s.DeriveCustomerNumber(It.IsAny<ClaimsPrincipal>(), It.IsAny<string>(), correlationId))
                .Returns(Task.FromResult("test"));

            _encryptionService
                .Setup(e => e.DecryptString(It.IsAny<string>(), true))
                .Returns<string, bool>((x, _) => x.Replace("encrypted", ""));

            _dxpClient
                .Setup(c => c.UpdateQuoteV2(policyNumber, It.IsAny<Tower.Core.Models.Dxp.PrecAuQuote>(), It.IsAny<string>(), correlationId, BrandType.Tower.Name))
                .ThrowsAsync(await ApiException.Create(
                    null!,
                    HttpMethod.Get,
                    new HttpResponseMessage(dxpResponse),
                    null!));

            var result = await _quoteController.UpdateMotor(
                new MotorQuote { CustomerNumber = "test" },
                new PolicyNumberRequest { PolicyNumber = $"encrypted{policyNumber}" },
                correlationId);

            _dxpClient.VerifyAll();

            Assert.IsType(expectedResultType, result.Result);
        }

        [Fact]
        public async Task UpdateMotor_WhenCustomerNumberException_Returns403()
        {
            const string correlationId = "correlationId";

            _encryptionService
                .Setup(e => e.DecryptString(It.IsAny<string>(), true))
                .Returns("");

            _customerNumberService
                .Setup(s => s.DeriveCustomerNumber(It.IsAny<ClaimsPrincipal>(), It.IsAny<string>(), correlationId))
                .Throws<CustomerNumberException>();

            var result = await _quoteController.UpdateMotor(
                new MotorQuote(),
                new PolicyNumberRequest(),
                correlationId);

            _dxpClient.VerifyAll();

            var actionResult = result.Result as ForbidResult;
            Assert.NotNull(actionResult);
        }

        [Fact]
        public async Task UpdateMotor_WhenDxpReturns500_LogsAndThrows()
        {
            const string correlationId = "correlationId";
            const string policyNumber = "policyNumber";
            const string uri = "http://api.com/";

            _customerNumberService
                .Setup(s => s.DeriveCustomerNumber(It.IsAny<ClaimsPrincipal>(), It.IsAny<string>(), correlationId))
                .Returns(Task.FromResult("test"));

            _encryptionService
                .Setup(e => e.DecryptString(It.IsAny<string>(), true))
                .Returns<string, bool>((x, _) => x.Replace("encrypted", ""));

            _dxpClient
                .Setup(c => c.UpdateQuoteV2(policyNumber, It.IsAny<Tower.Core.Models.Dxp.PrecAuQuote>(), It.IsAny<string>(), correlationId, BrandType.Tower.Name))
                .ThrowsAsync(await ApiException.Create(
                    new HttpRequestMessage(HttpMethod.Put, uri),
                    HttpMethod.Post,
                    new HttpResponseMessage(HttpStatusCode.InternalServerError),
                    null!));

            await Assert.ThrowsAsync<ApiException>(() =>
                _quoteController.UpdateMotor(
                    new MotorQuote { CustomerNumber = "test" },
                    new PolicyNumberRequest { PolicyNumber = $"encrypted{policyNumber}" },
                    correlationId));

            _dxpClient.VerifyAll();

            _logger.Verify(l => l.LogError($"Error response from API ({uri}).", It.IsAny<string>()));
        }

        [Fact]
        public async Task UpdateMotor_WhenDecryptPolicyNumberFails_Returns404()
        {
            const string correlationId = "correlationId";
            const string encryptedPolicyNumber = "encryptedPolicyNumber";

            _customerNumberService
                .Setup(s => s.DeriveCustomerNumber(It.IsAny<ClaimsPrincipal>(), It.IsAny<string>(), correlationId))
                .Returns(Task.FromResult("test"));

            _encryptionService
                .Setup(e => e.DecryptString(It.IsAny<string>(), true))
                .Throws(new EncryptionException("test"));

            var result = await _quoteController.UpdateMotor(
                new MotorQuote(),
                new PolicyNumberRequest { PolicyNumber = encryptedPolicyNumber },
                correlationId);

            var actionResult = result.Result as NotFoundObjectResult;
            Assert.NotNull(actionResult);
            Assert.Equal("Invalid PolicyNumber or CustomerNumber.", actionResult!.Value);
        }
    }
}
