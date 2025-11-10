class GoogleGenerativeAI {
  constructor() {
    // Mock implementation does not require an API key
  }

  getGenerativeModel() {
    return {
      generateContent: async (prompt) => ({
        response: {
          text: () => {
            try {
              const fallback = {
                add_transaction: false,
                amount: null,
                category: null,
                note: null,
                response_message:
                  'Dịch vụ AI giả lập đang chạy trong môi trường kiểm thử. Không thể phân tích yêu cầu thực tế.',
                datetime: null,
              };

              return typeof prompt === 'string'
                ? JSON.stringify(fallback)
                : JSON.stringify(fallback);
            } catch (error) {
              return JSON.stringify({
                add_transaction: false,
                amount: null,
                category: null,
                note: null,
                response_message: 'Không thể tạo phản hồi AI.',
                datetime: null,
              });
            }
          },
        },
      }),
    };
  }
}

export { GoogleGenerativeAI };
