/**
 * Budget entity UI component
 * Form component for adding/editing budgets
 */
import React, { useState, useEffect } from 'react';

const BudgetForm = ({ budget, onSave, onCancel }) => {
  const [current, setCurrent] = useState(budget.current || 0);
  const [max, setMax] = useState(budget.max || 0);
  const [timePeriod, setTimePeriod] = useState(budget.timePeriod || "month");
  const [name, setName] = useState(budget.name || "");
  const [startDate, setStartDate] = useState(
    budget.startDate ? new Date(budget.startDate) : new Date()
  );

  const formatDateTimeLocal = (date) => {
    const pad = (n) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (Number(current) < 0 || Number(max) < 0) {
      alert("Giá trị không được âm.");
      return;
    }

    if (Number(current) > Number(max)) {
      alert("Số tiền đã dùng không được lớn hơn hạn mức tối đa.");
      return;
    }
    onSave(budget.limit_id, {
      name,
      current: Number(current),
      max: Number(max),
      timePeriod,
      startDate: startDate.toISOString(),
    });
  };

  useEffect(() => {
    if (budget.limit_id) {
      setCurrent(budget.used || 0);
      setMax(budget.limit_amount || 0);
      setTimePeriod(budget.limit_time || "month");
      setName(budget.limit_name || "");
      setStartDate(budget.startDate ? new Date(budget.startDate) : new Date());
    } else {
      setCurrent(0);
      setMax(0);
      setTimePeriod("month");
      setName("");
      setStartDate(new Date());
    }
  }, [budget]);

  return (
    <div className="edit-limit-form">
      <h4>{budget.limit_id ? "Chỉnh sửa hạn mức" : "Thêm hạn mức"}</h4>
      <form onSubmit={handleSubmit}>
        <label>
          Tên hạn mức
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label>
          Đã dùng
          <input
            type="number"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            min="0"
          />
        </label>

        <label>
          Hạn mức tối đa
          <input
            type="number"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            min="0"
            required
          />
        </label>

        <label>
          Thời gian
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
          >
            <option value="5min">5 phút</option>
            <option value="day">Ngày</option>
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
            <option value="year">Năm</option>
          </select>
        </label>

        <label>
          Ngày bắt đầu
          <input
            type="datetime-local"
            value={formatDateTimeLocal(startDate)}
            onChange={(e) => setStartDate(new Date(e.target.value))}
          />
        </label>

        <div className="edit-actions">
          <button type="button" onClick={onCancel}>
            Hủy
          </button>
          <button type="submit">Lưu</button>
        </div>
      </form>
    </div>
  );
};

export default BudgetForm;
