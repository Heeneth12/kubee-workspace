export class SignInModel {
  email!: string;
  password!: string;
}

export class ForgotPasswordModel {
  email!: string;
}

export class ResendOtpModel {
  tenantId!: number;
}

export class ResetPasswordModel {
  email!: string;
  otp!: string;
  newPassword!: string;
}
