type SupabaseAuthError = {
  code?: string;
  message?: string;
  status?: number;
};

export function getSignUpErrorMessage(error: SupabaseAuthError) {
  if (error.status === 504) {
    return "Supabase Auth đã hết thời gian chờ. Nguyên nhân thường là Custom SMTP không kết nối được; hãy kiểm tra smtp.gmail.com, port 587 và Google App Password, hoặc tạm tắt Confirm email để thử local.";
  }

  switch (error.code) {
    case "email_address_not_authorized":
      return "Supabase chưa cho phép gửi email tới địa chỉ này. Hãy cấu hình Custom SMTP hoặc dùng email của thành viên project.";
    case "over_email_send_rate_limit":
      return "Đã vượt giới hạn gửi email của Supabase. Hãy chờ một lúc hoặc cấu hình Custom SMTP rồi thử lại.";
    case "weak_password":
      return "Mật khẩu chưa đạt chính sách bảo mật của Supabase. Hãy dùng ít nhất 8 ký tự gồm chữ và số.";
    case "email_address_invalid":
      return "Địa chỉ email không hợp lệ hoặc không được nhà cung cấp chấp nhận.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "Đăng ký bằng email đang bị tắt trong Supabase Authentication.";
    case "email_exists":
    case "user_already_exists":
      return "Email này đã có tài khoản. Hãy chuyển sang trang đăng nhập.";
  }

  const normalizedMessage = error.message?.toLowerCase() ?? "";

  if (normalizedMessage.includes("error sending confirmation email")) {
    return "Không thể gửi email xác nhận. Hãy kiểm tra cấu hình Custom SMTP trong Supabase.";
  }

  if (normalizedMessage.includes("database error saving new user")) {
    return "Không thể tạo hồ sơ người dùng trong database. Hãy kiểm tra migration và trigger handle_new_user.";
  }

  const reference = error.code ?? (error.status ? `HTTP ${error.status}` : null);
  return reference
    ? `Không thể tạo tài khoản. Mã lỗi Supabase: ${reference}.`
    : "Không thể kết nối Supabase để tạo tài khoản. Vui lòng thử lại.";
}
