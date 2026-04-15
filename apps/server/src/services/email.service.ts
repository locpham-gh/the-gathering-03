import nodemailer from "nodemailer";

export const sendEventEmail = async (
  toEmails: string[],
  eventDetails: {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    roomLink: string;
    hostName: string;
  }
) => {
  try {
    let transporter;

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      // Use real SMTP (e.g. Gmail)
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Setup mock Ethereal mail if no real SMTP exists. Best for testing.
      console.warn("⚠️ SMTP_USER not set. Falling back to Ethereal Mail...");
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

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
            <p style="margin: 0 0 10px 0; color: #020617;"><strong>Thời gian bắt đầu:</strong> ${new Date(eventDetails.startTime).toLocaleString('vi-VN')}</p>
            <p style="margin: 0 0 10px 0; color: #020617;"><strong>Thời lượng (Dự kiến):</strong> kết thúc lúc ${new Date(eventDetails.endTime).toLocaleString('vi-VN')}</p>
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
      from: `"The Gathering Ảo" <${process.env.SMTP_USER || "noreply@thegathering.com"}>`,
      to: toEmails.join(", "),
      subject: `[The Gathering] Lời mời tham gia: ${eventDetails.title}`,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully! Message ID:", info.messageId);
    
    if (!process.env.SMTP_USER) {
      console.log("🌐 Preview Ethereal URL: %s", nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return false;
  }
};
