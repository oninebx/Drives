using System.Diagnostics.CodeAnalysis;
using System.Net;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Refit;
using Tower.Core.Middleware.WhiteLabelling.Models;
using Tower.Digital.Policy.Models.Quote;
using Tower.Digital.Policy.Models.Quote.V2;
using Xunit;

namespace Tower.Digital.Policy.Tests.Controllers.V2
{
    [SuppressMessage("ReSharper", "ParameterOnlyUsedForPreconditionCheck.Local")]
    public partial class QuoteControllerTests
    {
        [Fact]
        public async Task UnderwriteMotor_CallsDxpAndReturnsResult()
        {
            const string correlationId = "correlationId";
            const string decryptedPolicyNumber = "decryptedPolicyNumber";
            const string encryptedPolicyNumber = "encryptedPolicyNumber";

            var request = new MotorQuote
            {
                PolicyNumber = encryptedPolicyNumber
            };

            var dxpResponse = GetValidateUnderwritingRulesResponse();

            _vehicleClient
                .Setup(c => c.GetVehicleByRedbookReference(It.IsAny<string>(), correlationId))
                .Returns(Task.FromResult(GetVehicleDetails()));

            _addressClient
                .Setup(c => c.GetAddressDetails(It.IsAny<long>(), correlationId))
                .Returns(Task.FromResult(new HttpClients.Models.Address.Address()));

            _encryptionService
                .Setup(e => e.DecryptString(encryptedPolicyNumber, true))
                .Returns(decryptedPolicyNumber);

            _dxpClient
                .Setup(c => c.ValidateUnderwritingRulesV2(decryptedPolicyNumber, It.IsAny<Tower.Core.Models.Dxp.PrecAuQuote>(), correlationId, BrandType.Tower.Name))
                .Returns(Task.FromResult(dxpResponse));

            var result = await _quoteController.UnderwriteMotor(request, correlationId);

            _dxpClient.VerifyAll();

            var actionResult = result.Result as OkObjectResult;
            Assert.NotNull(actionResult);

            var actionValue = actionResult!.Value as List<UnderwriteResponse>;
            Assert.NotNull(actionValue);

            Assert.Collection(actionValue, r =>
            {
                Assert.Equal(dxpResponse[0].ErrorCode, r.ErrorCode);
                Assert.Equal(dxpResponse[0].Message, r.Message);
                Assert.Equal(dxpResponse[0].Field, r.Field);
                Assert.Equal(dxpResponse[0].Referable, r.Referable);
            });
        }

        [Fact]
        public async Task UnderwriteMotor_WhenDxpReturns422_Returns422()
        {
            const string correlationId = "correlationId";
            const string decryptedPolicyNumber = "decryptedPolicyNumber";
            const string encryptedPolicyNumber = "encryptedPolicyNumber";

            var request = new MotorQuote
            {
                PolicyNumber = encryptedPolicyNumber
            };

            _vehicleClient
                .Setup(c => c.GetVehicleByRedbookReference(It.IsAny<string>(), correlationId))
                .Returns(Task.FromResult(GetVehicleDetails()));

            _addressClient
                .Setup(c => c.GetAddressDetails(It.IsAny<long>(), correlationId))
                .Returns(Task.FromResult(new HttpClients.Models.Address.Address()));

            _encryptionService
                .Setup(e => e.DecryptString(encryptedPolicyNumber, true))
                .Returns(decryptedPolicyNumber);

            _dxpClient
                .Setup(c => c.ValidateUnderwritingRulesV2(It.IsAny<string>(), It.IsAny<Tower.Core.Models.Dxp.PrecAuQuote>(), correlationId, BrandType.Tower.Name))
                .ThrowsAsync(await ApiException.Create(
                    null!,
                    HttpMethod.Post,
                    new HttpResponseMessage(HttpStatusCode.UnprocessableEntity),
                    null!));

            var result = await _quoteController.UnderwriteMotor(request, correlationId);

            _dxpClient.VerifyAll();

            var actionResult = result.Result as UnprocessableEntityObjectResult;
            Assert.NotNull(actionResult);
        }
    }
}
