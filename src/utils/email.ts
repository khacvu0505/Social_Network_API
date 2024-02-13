import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import fs from 'fs';
import path from 'path';
import { envConfig } from '~/constants/config';

const verifyEmailTemplate = fs.readFileSync(path.resolve('src/templates/verify-email.html'), 'utf8');

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
}: {
  fromAddress: string;
  toAddresses: string | string[];
  ccAddresses?: string | string[];
  body: string;
  subject: string;
  replyToAddresses?: string | string[];
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
const sendVerifyEmail = async (toAddress: string, subject: string, body: string) => {
  const sendEmailCommand = createSendEmailCommand({
    fromAddress: envConfig.SES_FROM_ADDRESS_AWS,
    toAddresses: toAddress,
    body,
    subject
  });

  return sesClient.send(sendEmailCommand);
};

export const sendVerifyRegisterEmail = (
  toAddress: string,
  emailVerifyToken: string,
  template = verifyEmailTemplate
) => {
  return sendVerifyEmail(
    toAddress,
    'Verify your email',
    template
      .replace('{{title}}', 'Please verify your email')
      .replace('{{content}}', 'Please click the button below to verify your email')
      .replace('{{titleLink}}', 'Verify')
      .replace('{{link}}', `${envConfig.CLIENT_URL}/verify-email/?token=${emailVerifyToken}`)
  );
};

export const sendForgotPasswordEmail = (
  toAddress: string,
  forgotPasswordToken: string,
  template = verifyEmailTemplate
) => {
  return sendVerifyEmail(
    toAddress,
    'Forgot your password?',
    template
      .replace('{{title}}', 'You requested to reset your password')
      .replace('{{content}}', 'Please click the button below to reset your password')
      .replace('{{titleLink}}', 'Reset Password')
      .replace('{{link}}', `${envConfig.CLIENT_URL}/reset-password/?token=${forgotPasswordToken}`)
  );
};
