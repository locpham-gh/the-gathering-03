import nodemailer from "nodemailer";

async function getGmailTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  if (!emailUser || !emailPass) {
    throw new Error("EMAIL_USER/EMAIL_PASS is required for Gmail SMTP.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  return { transporter, emailUser };
}

export const sendOtpEmail = async (toEmail: string, otpCode: string) => {
  try {
    const { transporter, emailUser } = await getGmailTransporter();

    const mailOptions = {
      from: `"The Gathering OTP" <${emailUser}>`,
      to: toEmail,
      subject: "[The Gathering] Mã OTP đăng nhập",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px;">
          <h2 style="margin: 0 0 12px; color: #111827;">Mã OTP của bạn</h2>
          <p style="color: #374151; line-height: 1.5;">
            Dùng mã bên dưới để đăng nhập vào The Gathering. Mã có hiệu lực trong 5 phút.
          </p>
          <div style="margin: 16px 0; font-size: 28px; font-weight: 700; letter-spacing: 8px; color: #2563eb;">
            ${otpCode}
          </div>
          <p style="color: #6b7280; font-size: 12px;">
            Nếu bạn không yêu cầu mã này, bạn có thể bỏ qua email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ OTP email sent. Message ID:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Failed to send OTP email:", error);
    return false;
  }
};

export const sendEventEmail = async (
  toEmails: string[],
  eventDetails: {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    roomLink: string;
    hostName: string;
  },
) => {
  try {
    const { transporter, emailUser } = await getGmailTransporter();

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
          <h2 style="color: #0f172a; margin: 0;">Lời mời họp Mới! 📅</h2>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h3 style="color: #334155;">Chào bạn,</h3>
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">Bạn vừa nhận được lời mời tham dự không gian thực tế ảo Metaverse từ <b>${eventDetails.hostName}</b>. Dưới đây là chi tiết sự kiện:</p>
          
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #020617;"><strong>Sự kiện:</strong> ${eventDetails.title}</p>
            <p style="margin: 0 0 10px 0; color: #020617;"><strong>Thời gian bắt đầu:</strong> ${new Date(eventDetails.startTime).toLocaleString("vi-VN")}</p>
            <p style="margin: 0 0 10px 0; color: #020617;"><strong>Thời lượng (Dự kiến):</strong> kết thúc lúc ${new Date(eventDetails.endTime).toLocaleString("vi-VN")}</p>
            <p style="margin: 0; color: #020617;"><strong>Nội dung:</strong> ${eventDetails.description}</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${eventDetails.roomLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Tham gia Phòng Họp</a>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; text-align: center;">Vui lòng truy cập qua trình duyệt Web (Chrome/Edge) trên máy tính để trải nghiệm không gian Metaverse.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"The Gathering Ảo" <${emailUser}>`,
      to: toEmails.join(", "),
      subject: `[The Gathering] Lời mời tham gia: ${eventDetails.title}`,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully! Message ID:", info.messageId);

    return true;
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return false;
  }
};
