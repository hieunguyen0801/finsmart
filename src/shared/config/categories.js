/**
 * Shared configuration for transaction categories
 * Centralized category definitions used across the application
 */

export const incomeCategories = [
  { value: "tiền lương", label: "💼 Tiền lương" },
  { value: "bán hàng", label: "🛒 Bán hàng" },
  { value: "cho thuê", label: "🏠 Cho thuê" },
  { value: "tiền thưởng", label: "💵 Tiền thưởng" },
  { value: "đầu tư", label: "📈 Đầu tư" },
  { value: "cổ tức", label: "💰 Cổ tức" },
  { value: "quảng cáo", label: "📢 Thu nhập từ quảng cáo" },
  { value: "đối tác", label: "👫 Tiền thưởng từ đối tác" },
  { value: "tài sản", label: "🏢 Thu nhập từ sở hữu tài sản" },
  { value: "thu động", label: "🏖️ Thu nhập thụ động" },
  { value: "bố mẹ chuyển", label: "👨‍👩‍👧‍👦 Tiền bố mẹ chuyển" },
];

export const expenseCategories = [
  { value: "ăn uống", label: "🍔 Ăn uống" },
  { value: "mua sắm", label: "🛍️ Mua sắm" },
  { value: "sinh hoạt", label: "🏡 Sinh hoạt" },
  { value: "giải trí", label: "🎧 Giải trí" },
  { value: "di chuyển", label: "🚗 Di chuyển" },
  { value: "học tập", label: "📚 Học tập" },
  { value: "thể thao", label: "⚽ Thể thao" },
  { value: "công việc", label: "💼 Công việc" },
];

export const allCategories = [...incomeCategories, ...expenseCategories];

export const categoryIcons = {};
allCategories.forEach((item) => {
  const emoji = item.label.split(" ")[0];
  categoryIcons[item.value.toLowerCase()] = emoji;
});
