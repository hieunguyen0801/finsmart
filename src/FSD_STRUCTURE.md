# Feature-Sliced Design (FSD) Structure

Dự án FinSmartProject đã được refactor để áp dụng Feature-Sliced Design (FSD) architecture.

## Cấu trúc thư mục

```
src/
├── app/                    # Global configuration layer
│   ├── providers/          # Global providers (QueryClient, ErrorBoundary)
│   │   ├── QueryClientProvider.jsx
│   │   ├── ErrorBoundary.jsx
│   │   └── index.js
│   ├── AppRouter.jsx       # Main routing configuration
│   ├── App.jsx            # Root application component
│   └── index.js
├── pages/                  # Layout-level components
│   ├── HomePage.jsx        # Dashboard page
│   ├── TransactionsPage.jsx # Transaction management page
│   └── ProfilePage.jsx     # User profile page
├── widgets/                # Composite UI blocks
│   └── TransactionList/
│       ├── ui/
│       │   └── TransactionList.jsx
│       └── index.js
├── features/               # Business features
│   ├── transaction-add/
│   │   ├── ui/            # UI components for transaction creation
│   │   ├── model/         # Business logic hooks
│   │   │   └── useAddTransaction.js
│   │   ├── api/           # API calls
│   │   │   └── addTransaction.js
│   │   └── index.js
│   └── authentication/
│       ├── ui/            # Login/Register components
│       ├── model/         # Auth logic hooks
│       │   └── useAuth.js
│       ├── api/           # Auth API calls
│       │   └── authAPI.js
│       └── index.js
├── entities/               # Domain entities
│   ├── transaction/
│   │   ├── ui/            # Transaction UI components
│   │   │   └── TransactionCard.jsx
│   │   ├── model/         # Transaction data hooks
│   │   │   └── useTransactions.js
│   │   ├── api/           # Transaction API
│   │   │   └── transactionRepository.js
│   │   └── index.js
│   └── user/
│       ├── ui/            # User UI components
│       ├── model/         # User data hooks
│       │   └── useUser.js
│       ├── api/           # User API
│       │   └── userRepository.js
│       └── index.js
└── shared/                 # Shared resources
    ├── ui/                # Reusable UI components
    │   ├── ProtectedRoute.jsx
    │   ├── Sidebar.jsx
    │   └── index.js
    ├── lib/               # Libraries and utilities
    │   ├── supabase.js    # Database client
    │   └── index.js
    ├── config/            # Configuration
    │   ├── categories.js  # Transaction categories
    │   ├── constants.js   # App constants
    │   └── index.js
    ├── hooks/             # Shared hooks
    │   ├── useAuth.js     # Authentication hook
    │   └── index.js
    └── index.js
```

## Các thay đổi chính

### 1. **App Layer** (`src/app/`)

- **Mục đích**: Cấu hình toàn cục cho ứng dụng
- **Thay đổi**: Di chuyển từ `src/frontend/AppRouter.js` thành cấu trúc FSD
- **Chức năng**:
  - Providers (QueryClient, ErrorBoundary)
  - Routing configuration
  - Root application component

### 2. **Pages Layer** (`src/pages/`)

- **Mục đích**: Layout-level components kết hợp widgets và features
- **Thay đổi**: Tạo mới từ các component trong `src/frontend/pages/`
- **Chức năng**:
  - HomePage: Dashboard chính với biểu đồ và lịch sử giao dịch
  - TransactionsPage: Quản lý giao dịch với voice input
  - ProfilePage: Thông tin người dùng

### 3. **Widgets Layer** (`src/widgets/`)

- **Mục đích**: Composite UI blocks kết hợp nhiều features/entities
- **Thay đổi**: Tạo mới TransactionList widget
- **Chức năng**: Hiển thị danh sách giao dịch với TransactionCard

### 4. **Features Layer** (`src/features/`)

- **Mục đích**: User interactions và business use-cases
- **Thay đổi**: Tách logic từ pages thành features riêng biệt
- **Chức năng**:
  - transaction-add: Thêm giao dịch với validation và limit checking
  - authentication: Đăng nhập, đăng ký, reset password

### 5. **Entities Layer** (`src/entities/`)

- **Mục đích**: Core domain entities
- **Thay đổi**: Tách logic từ components thành entities
- **Chức năng**:
  - transaction: Quản lý dữ liệu giao dịch
  - user: Quản lý thông tin người dùng và ví

### 6. **Shared Layer** (`src/shared/`)

- **Mục đích**: Tài nguyên dùng chung
- **Thay đổi**: Di chuyển từ `src/database/supabase.js` và tạo thêm
- **Chức năng**:
  - ui: ProtectedRoute, Sidebar
  - lib: Supabase client
  - config: Categories, constants
  - hooks: useAuth

## Lợi ích của FSD

1. **Tách biệt rõ ràng**: Mỗi layer có trách nhiệm riêng biệt
2. **Tái sử dụng cao**: Shared components và entities có thể dùng ở nhiều nơi
3. **Dễ bảo trì**: Logic nghiệp vụ được tách riêng khỏi UI
4. **Scalable**: Dễ dàng thêm features và entities mới
5. **Testable**: Logic nghiệp vụ có thể test độc lập

## Import Paths

Tất cả import paths đã được cập nhật để sử dụng cấu trúc FSD mới:

```javascript
// Trước (cũ)
import supabase from "../../database/supabase";
import { incomeCategories } from "./some-component";

// Sau (FSD)
import { supabase } from "../shared";
import { incomeCategories } from "../shared/config";
```

## Build Status

✅ **Build thành công** - Ứng dụng build không có lỗi
⚠️ **Warnings** - Một số warnings từ legacy code (các file cũ chưa refactor)

## Next Steps

1. Refactor các pages còn lại (AI, History, Statistic, etc.)
2. Tạo thêm entities cho Budget/Limit management
3. Thêm error handling và loading states
4. Implement React Query cho data fetching
5. Thêm unit tests cho business logic
