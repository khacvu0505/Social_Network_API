const { SendEmailCommand, SESClient } = require('@aws-sdk/client-ses');
import { envConfig } from './src/constants/config';

// Create SES service object.
const sesClient = new SESClient({
  region: envConfig.REGION_AWS,
  credentials: {
    secretAccessKey: envConfig.SECRET_ACCESS_KEY_AWS,
    accessKeyId: envConfig.ACCESS_KEY_ID_AWS
  }
});

const createSendEmailCommand = ({
  fromAddress,
  toAddresses,
  ccAddresses = [],
  body,
  subject,
  replyToAddresses = []
}) => {
  return new SendEmailCommand({
    Destination: {
      /* required */
      CcAddresses: ccAddresses instanceof Array ? ccAddresses : [ccAddresses],
      ToAddresses: toAddresses instanceof Array ? toAddresses : [toAddresses]
    },
    Message: {
      /* required */
      Body: {
        /* required */
        Html: {
          Charset: 'UTF-8',
          Data: body
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: fromAddress,
    ReplyToAddresses: replyToAddresses instanceof Array ? replyToAddresses : [replyToAddresses]
  });
};

const sendVerifyEmail = async (toAddress, subject, body) => {
  const sendEmailCommand = createSendEmailCommand({
    fromAddress: envConfig.SES_FROM_ADDRESS_AWS,
    toAddresses: toAddress,
    body,
    subject
  });

  try {
    return await sesClient.send(sendEmailCommand);
  } catch (e) {
    console.error('Failed to send email.');
    return e;
  }
};

sendVerifyEmail('nkkhacvu32@gmail.com', 'Tiêu đề email', '<h1>Nội dung email được gửi từ khacvu0505@gmail.com</h1>');
