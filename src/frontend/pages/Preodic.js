import "./Preodic.css";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useCallback } from "react";
import CryptoJS from "crypto-js";
import supabase from "../../database/supabase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;

function Preodic() {
  const navigate = useNavigate();
  const handleHome = () => {
    navigate("/home");
  };
  const handleTransaction = () => {
    navigate("/transaction");
  };
  const handleAI = () => {
    navigate("/ai");
  };
  const handleProfile = () => {
    navigate("/profile");
  };
  const handleEconomical = () => {
    navigate("/economical");
  };
  const handleStatistic = () => {
    navigate("/statistic");
  };

  const [userId, setUserId] = useState(null);
  const [walletId, setWalletId] = useState(0);

  const [periodicData, setPeriodicData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPeriodic, setNewPeriodic] = useState({
    name_preodic: "",
    amount: "",
    frequency: "Hàng tháng",
    startDate: "",
    endDate: "",
    is_active: true,
  });

  // State để hiển thị form
  const [showForm, setShowForm] = useState(false);

  // Hàm đóng form
  const handleCloseForm = () => setShowForm(false);

  // Xử lý nút Add
  const handleAdd = () => setShowForm(true);

  useEffect(() => {
    const encryptedUserId = localStorage.getItem("user_id");
    if (!encryptedUserId || !SECRET_KEY) {
      return;
    }

    try {
      const bytes = CryptoJS.AES.decrypt(encryptedUserId, SECRET_KEY);
      const parsed = parseInt(bytes.toString(CryptoJS.enc.Utf8), 10);
      if (!Number.isNaN(parsed)) {
        setUserId(parsed);
      }
    } catch (err) {
      console.error("Không thể giải mã user_id:", err);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewPeriodic((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const startDate =
        newPeriodic.frequency === "3 phút"
          ? new Date()
          : new Date(newPeriodic.startDate);
      const nextExecution = calculateNextExecution(
        startDate,
        newPeriodic.frequency
      );
      if (!userId || !walletId) {
        alert("Không thể xác định người dùng hoặc ví.");
        return;
      }

      const { data, error } = await supabase
        .from("preodic")
        .insert([
          {
            ...newPeriodic,
            user_id: userId,
            wallet_id: walletId,
            amount: Number(newPeriodic.amount),
            startDate: new Date(newPeriodic.startDate)
              .toISOString()
              .split("T")[0],
            endDate: new Date(newPeriodic.endDate).toISOString().split("T")[0],
            created_at: new Date().toISOString(), // Thêm dòng này
            next_execution: nextExecution,
          },
        ])
        .select();

      if (error) throw error;

      const inserted = data[0];
      console.log("Inserted record:", inserted);

      setPeriodicData((prev) => [
        ...prev,
        {
          ...inserted,
          name: inserted.name_preodic,
          status: newPeriodic.is_active ? "Hoạt động" : "Tạm dừng",
          amount: Number(newPeriodic.amount),
          startDate: new Date(newPeriodic.startDate).toLocaleDateString(
            "vi-VN"
          ),
          endDate: new Date(newPeriodic.endDate).toLocaleDateString("vi-VN"),
        },
      ]);

      setShowForm(false);
      setNewPeriodic({
        name_preodic: "",
        amount: "",
        frequency: "Hàng tháng",
        startDate: "",
        endDate: "",
        is_active: true,
      });
    } catch (err) {
      console.error("Lỗi khi thêm định kỳ:", err);
      alert("Có lỗi xảy ra khi thêm định kỳ!");
    }
  };

  const [showEditForm, setShowEditForm] = useState(false);
  const [editPeriodic, setEditPeriodic] = useState({
    name: "",
    amount: "",
    frequency: "Hàng tháng",
    startDate: "",
    endDate: "",
    status: "Hoạt động",
  });

  const handleEdit = (item) => {
    setEditPeriodic({
      name: item.name,
      amount: item.amount,
      frequency: item.frequency,
      startDate: item.startDate.split("/").reverse().join("-"), // Chuyển về yyyy-mm-dd
      endDate: item.endDate.split("/").reverse().join("-"),
      status: item.status,
      id: item.id,
    });
    setShowEditForm(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditPeriodic((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("preodic")
        .update({
          name_preodic: editPeriodic.name,
          amount: Number(editPeriodic.amount),
          frequency: editPeriodic.frequency,
          startDate: new Date(editPeriodic.startDate).toISOString(),
          endDate: new Date(editPeriodic.endDate).toISOString(),
          is_active: editPeriodic.status === "Hoạt động",
        })
        .eq("id", editPeriodic.id);

      if (error) throw error;

      setPeriodicData((prev) =>
        prev.map((item) =>
          item.id === editPeriodic.id
            ? {
                ...item,
                name: editPeriodic.name,
                amount: Number(editPeriodic.amount),
                frequency: editPeriodic.frequency,
                startDate: new Date(editPeriodic.startDate).toLocaleDateString(
                  "vi-VN"
                ),
                endDate: new Date(editPeriodic.endDate).toLocaleDateString(
                  "vi-VN"
                ),
                status: editPeriodic.status,
              }
            : item
        )
      );
      setShowEditForm(false);
    } catch (err) {
      console.error("Lỗi khi cập nhật định kỳ:", err);
      alert("Có lỗi khi cập nhật định kỳ!");
    }
  };

  // Hàm xử lý xóa
  const handleDelete = async (id) => {
    console.log(id);
    if (!id) {
      console.error("ID không hợp lệ");
      return;
    }
    if (window.confirm("Bạn có chắc muốn xóa định kỳ này không?")) {
      try {
        const { error } = await supabase.from("preodic").delete().eq("id", id);

        if (error) throw error;

        // Cập nhật state bằng cách lọc ra item có id trùng khớp
        setPeriodicData((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        console.error("Lỗi khi xóa định kỳ:", err);
        alert("Có lỗi xảy ra khi xóa định kỳ!");
      }
    }
  };

  const calculateNextExecution = (startDate, frequency) => {
    let date = new Date(startDate);

    // Xử lý trường hợp ngày không hợp lệ
    if (isNaN(date.getTime())) {
      date = new Date();
    }

    switch (frequency) {
      case "3 phút":
        date = new Date(); // Dùng thời gian hiện tại
        date.setMinutes(date.getMinutes() + 3);
        break;
      case "Hàng ngày":
        date.setDate(date.getDate() + 1);
        break;
      case "Hàng tuần":
        date.setDate(date.getDate() + 7);
        break;
      case "Hàng tháng":
        date.setMonth(date.getMonth() + 1);
        break;
      case "Hàng quý":
        date.setMonth(date.getMonth() + 3);
        break;
      case "Hàng năm":
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        break;
    }

    return date.toISOString(); // Trả về cả ngày và giờ
  };

  const processPeriodicTransactions = useCallback(async () => {
    if (!userId) return;

    const nowISO = new Date().toISOString(); // Lấy cả giờ phút hiện tại

    // Lấy danh sách các định kỳ cần xử lý
    const { data: periodicList, error } = await supabase
      .from("preodic")
      .select("*")
      .lte("next_execution", nowISO) // Ngày thực hiện <= hôm nay
      .eq("is_active", true);

    if (error) {
      console.error("Lỗi khi lấy danh sách định kỳ:", error);
      return;
    }

    for (const item of periodicList) {
      // Kiểm tra số dư ví
      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("balance")
        .eq("wallet_id", item.wallet_id)
        .single();

      if (walletError || wallet.balance < item.amount) {
        // Nếu không đủ tiền, đánh dấu định kỳ là lỗi
        await supabase
          .from("preodic")
          .update({ is_active: false })
          .eq("id", item.id);
        continue;
      }

      // Trừ tiền từ ví
      const newBalance = wallet.balance - item.amount;
      await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("wallet_id", item.wallet_id);

      // Ghi log giao dịch
      await supabase.from("transactions").insert([
        {
          created_at: new Date().toISOString(),
          user_id: userId,
          wallet_id: item.wallet_id,
          category: item.name_preodic || item.name, // lấy tên định kỳ
          amount: item.amount,
          note: `Gia hạn định kỳ ${item.name_preodic || item.name}`,
        },
      ]);

      // Cập nhật next_execution cho lần tiếp theo
      const nextExec = calculateNextExecution(
        item.next_execution,
        item.frequency
      );
      if (!nextExec) {
        await supabase
          .from("preodic")
          .update({ is_active: false })
          .eq("id", item.id);
        continue;
      }
      await supabase
        .from("preodic")
        .update({ next_execution: nextExec })
        .eq("id", item.id);

      if (new Date(item.endDate) < new Date()) {
        await supabase
          .from("preodic")
          .update({ is_active: false })
          .eq("id", item.id);
        continue;
      }
    }
  }, [userId]);

  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'active', 'inactive'
  const filteredData = periodicData.filter((item) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") return item.status === "Hoạt động";
    if (filterStatus === "inactive") return item.status === "Tạm dừng";
    return true;
  });

  const getDaysLeft = (endDateStr) => {
    // Nếu là dạng dd/mm/yyyy
    if (endDateStr.includes("/")) {
      const [day, month, year] = endDateStr.split("/").map(Number);
      const end = new Date(year, month - 1, day);
      const today = new Date();
      end.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = end - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    // Nếu là dạng yyyy-mm-dd hoặc yyyy-mm-ddTHH:mm:ss...
    const end = new Date(endDateStr);
    const today = new Date();
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = end - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    if (!userId) {
      return;
    }

    const fetchWallet = async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching wallet:", error);
        return null;
      }

      setWalletId(data.wallet_id);

      return data;
    };
    fetchWallet();

    const fetchPeriodicData = async () => {
      try {
        const { data, error } = await supabase
          .from("preodic")
          .select(
            "id, name_preodic, amount, frequency, startDate, endDate, is_active"
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const formattedData = data.map((item) => ({
          id: item.id, // phải có dòng này!
          name: item.name_preodic,
          amount: item.amount,
          frequency: item.frequency,
          startDate: item.startDate, // giữ nguyên
          endDate: item.endDate, // giữ nguyên
          status: item.is_active ? "Hoạt động" : "Tạm dừng",
          next_execution: item.next_execution, // nếu có
        }));

        setPeriodicData(formattedData);
      } catch (err) {
        setError(err.message);
        console.error("Lỗi khi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPeriodicData();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Chạy lần đầu khi component mount
    processPeriodicTransactions();

    // Cài đặt interval kiểm tra mỗi ngày
    const interval = setInterval(() => {
      processPeriodicTransactions();
    }, 24 * 60 * 60 * 1000); // 24 giờ

    return () => clearInterval(interval);
  }, [processPeriodicTransactions, userId]);

  // Trong useEffect hoặc sau khi fetch periodicData:
  useEffect(() => {
    periodicData.forEach((item) => {
      if (item.status === "Hoạt động" && item.next_execution) {
        const nextExec = new Date(item.next_execution);
        const today = new Date();
        // Nếu đến hạn trong hôm nay
        if (
          nextExec.getDate() === today.getDate() &&
          nextExec.getMonth() === today.getMonth() &&
          nextExec.getFullYear() === today.getFullYear()
        ) {
          toast.info(
            `Định kỳ "${
              item.name
            }" đến hạn thực hiện hôm nay (${item.amount.toLocaleString()} đ)!`,
            { position: "top-right" }
          );
        }
      }
    });
  }, [periodicData]);

  if (error) return <div className="error">Lỗi: {error}</div>;

  return (
    <div className="bodyPre">
      <div className="sidebarhome">
        <div className="logo">
          <img src="Soucre/Logo.png" alt="Logo FinSmart" />
          <span className="logo-text">FinSmart</span>
        </div>
        <nav>
          <button className="nav-btn home" onClick={handleHome}>
            <img src="Soucre/Dashboard.png" alt="Trang chủ" />
            <span className="nav-label">Trang chủ</span>
          </button>
          <button className="nav-btn add" onClick={handleTransaction}>
            <img src="Soucre/AddTransaction.png" alt="Thêm Giao dịch" />
            <span className="nav-label">Giao dịch</span>
          </button>
          <button className="nav-btn eco">
            <img src="Soucre/preodic-icon.png" alt="Tiết kiệm" />
            <span className="nav-label">Định kỳ</span>
          </button>
          <button className="nav-btn eco" onClick={handleStatistic}>
            <img src="Soucre/statistic.png" alt="Thống kê" />
            <span className="nav-label">Thống kê</span>
          </button>
          <button className="nav-btn eco" onClick={handleEconomical}>
            <img src="Soucre/economy-icon.png" alt="Tiết kiệm" />
            <span className="nav-label">Tiết kiệm</span>
          </button>
          <button className="nav-btn AI" onClick={handleAI}>
            <img src="Soucre/AI.png" alt="Chatbot" />
            <span className="nav-label">Chatbot</span>
          </button>
          <button className="nav-btn user" onClick={handleProfile}>
            <img src="Soucre/Logout.png" alt="Đăng xuất" />
            <span className="nav-label">Thông tin cá nhân</span>
          </button>
        </nav>
      </div>

      <div className="periodic-table-container">
        <div className="table-header">
          <h2>Danh sách định kỳ</h2>
          <div className="filter-container">
            <label htmlFor="statusFilter" className="filter-label">
              Trạng thái:
            </label>
            <select
              id="statusFilter"
              className="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </select>
          </div>
          <button className="btnpre add-btn" onClick={handleAdd}>
            + Thêm định kỳ
          </button>
          {showForm && (
            <div className="overlay">
              <div className="form-container">
                <h2>Thêm định kỳ mới</h2>
                <form
                  onSubmit={handleSubmit}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="form-group">
                    <label>
                      Tên định kỳ <span>*</span>
                    </label>
                    <input
                      type="text"
                      name="name_preodic"
                      value={newPeriodic.name_preodic}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Số tiền <span>*</span>
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={newPeriodic.amount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Tần suất <span>*</span>
                    </label>
                    <select
                      name="frequency"
                      value={newPeriodic.frequency}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="3 phút">3 phút</option>
                      <option value="Hàng ngày">Hàng ngày</option>
                      <option value="Hàng tuần">Hàng tuần</option>
                      <option value="Hàng tháng">Hàng tháng</option>
                      <option value="Hàng quý">Hàng quý</option>
                      <option value="Hàng năm">Hàng năm</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        Ngày bắt đầu <span>*</span>
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={newPeriodic.startDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Ngày kết thúc <span>*</span>
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={newPeriodic.endDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group checkbox">
                    <label>
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={newPeriodic.is_active}
                        onChange={handleInputChange}
                      />
                      Kích hoạt ngay
                    </label>
                  </div>
                  <div className="form-actions">
                    <button type="button" onClick={handleCloseForm}>
                      Hủy
                    </button>
                    <button type="submit">Lưu</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
        <table className="periodic-table">
          <thead>
            <tr>
              <th>Tên định kỳ</th>
              <th>Số tiền</th>
              <th>Tần suất</th>
              <th>Ngày bắt đầu</th>
              <th>Ngày kết thúc</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7">Đang tải...</td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id}>
                  {" "}
                  {/* Sử dụng item.id làm key thay vì index */}
                  <td>{item.name}</td>
                  <td>{item.amount.toLocaleString()} đ</td>
                  <td>{item.frequency}</td>
                  <td>{item.startDate}</td>
                  <td>{item.endDate}</td>
                  <td data-status={item.status}>{item.status}</td>
                  <td>
                    <button
                      className="btnpre edit-btn"
                      onClick={() => handleEdit(item)} // Nên truyền id cho hàm edit
                    >
                      Sửa
                    </button>
                    {showEditForm && (
                      <div className="overlay2">
                        <div className="form-container">
                          <h2>Chỉnh sửa định kỳ</h2>
                          <form
                            onSubmit={handleEditSubmit}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="form-group">
                              <label>Tên định kỳ</label>
                              <input
                                type="text"
                                name="name"
                                value={editPeriodic.name}
                                onChange={handleEditInputChange}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Số tiền</label>
                              <input
                                type="number"
                                name="amount"
                                value={editPeriodic.amount}
                                onChange={handleEditInputChange}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Tần suất</label>
                              <select
                                name="frequency"
                                value={editPeriodic.frequency}
                                onChange={handleEditInputChange}
                                required
                              >
                                <option value="Hàng ngày">Hàng ngày</option>
                                <option value="Hàng tuần">Hàng tuần</option>
                                <option value="Hàng tháng">Hàng tháng</option>
                                <option value="Hàng quý">Hàng quý</option>
                                <option value="Hàng năm">Hàng năm</option>
                              </select>
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Ngày bắt đầu</label>
                                <input
                                  type="date"
                                  name="startDate"
                                  value={editPeriodic.startDate}
                                  onChange={handleEditInputChange}
                                  required
                                />
                              </div>
                              <div className="form-group">
                                <label>Ngày kết thúc</label>
                                <input
                                  type="date"
                                  name="endDate"
                                  value={editPeriodic.endDate}
                                  onChange={handleEditInputChange}
                                  required
                                />
                              </div>
                            </div>
                            <div className="form-group">
                              <label>Trạng thái</label>
                              <select
                                name="status"
                                value={editPeriodic.status}
                                onChange={handleEditInputChange}
                              >
                                <option value="Hoạt động">Hoạt động</option>
                                <option value="Tạm dừng">Tạm dừng</option>
                              </select>
                            </div>
                            <div className="form-actions">
                              <button
                                type="button"
                                onClick={() => setShowEditForm(false)}
                              >
                                Hủy
                              </button>
                              <button type="submit">Lưu thay đổi</button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                    <button
                      className="btnpre delete-btn"
                      onClick={() => {
                        console.log(item);
                        handleDelete(item.id);
                      }} // Truyền đúng id
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="periodic-notice">
        <h2>Nhắc nhở</h2>
        {periodicData
          .filter(
            (item) =>
              item.status === "Hoạt động" &&
              getDaysLeft(item.endDate) <= 3 &&
              getDaysLeft(item.endDate) >= 0
          )
          .map((item) => (
            <div key={item.id} className="reminder-item">
              <strong>{item.name}</strong> sẽ kết thúc trong{" "}
              <span className="days-left">
                {getDaysLeft(item.endDate)} ngày
              </span>{" "}
              nữa.
            </div>
          ))}
        {periodicData.filter(
          (item) =>
            item.status === "Hoạt động" &&
            getDaysLeft(item.endDate) <= 3 &&
            getDaysLeft(item.endDate) >= 0
        ).length === 0 && (
          <div className="notice-empty">Không có định kỳ nào sắp hết hạn.</div>
        )}
      </div>
    </div>
  );
}
<ToastContainer />;
export default Preodic;
