import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button, Modal, Form, Input, DatePicker, Tag,
  Space, Popconfirm, Card, Spin, Alert, Typography,Table
} from 'antd';
import {
  Edit, Trash2, MessageSquare, DollarSign, User, Calendar, Plus, Download
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const { Title, Text } = Typography;

const API_BASE = import.meta.env.VITE_BASE_URI;

function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE}/expenses`);
      setExpenses(res.data.expenses || []);
      setTotalExpense(res.data.totalExpense || 0);
    } catch (err) {
      setError('Failed to fetch expenses.');
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (expenses.length === 0) return toast.error("No data to export");

    const summary = [{ Description: "TOTAL EXPENSE", Amount: totalExpense }];
    const data = expenses.map((e, i) => ({
      'S.No': i + 1,
      Description: e.description,
      Amount: e.amount,
      'Paid By': e.paidBy,
      Date: dayjs(e.date).format('DD MMM YYYY'),
    }));

    const ws = XLSX.utils.json_to_sheet([...summary, {}, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer]), "expense_report.xlsx");
    toast.success("Downloaded!");
  };

  const deleteExpense = async (id) => {
    try {
      await axios.delete(`${API_BASE}/expenses/${id}`);
      toast.success("Deleted!");
      fetchExpenses();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const showEditModal = (expense) => {
    setEditingExpense(expense);
    form.setFieldsValue({
      description: expense.description,
      amount: expense.amount,
      paidBy: expense.paidBy,
      date: dayjs(expense.date),
    });
    setEditModalVisible(true);
  };

  const handleEdit = async (values) => {
    try {
      await axios.put(`${API_BASE}/expenses/${editingExpense._id}`, {
        ...values,
        date: values.date.toISOString(),
      });
      toast.success("Updated!");
      setEditModalVisible(false);
      form.resetFields();
      fetchExpenses();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  // Mobile Card Component
  const ExpenseCard = ({ expense, index }) => (
    <Card
      className="mb-4 shadow-md border-l-4 border-red-500 hover:shadow-lg transition-shadow"
      key={expense._id}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Text strong className="text-lg">{expense.description}</Text>
            <Tag color="volcano" className="text-xs">#{index + 1}</Tag>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-red-600 font-bold">
              <DollarSign className="w-4 h-4" />
              <span className="text-lg">-₹{expense.amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span>Paid by: <strong>{expense.paidBy}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{dayjs(expense.date).format('DD MMMM YYYY')}</span>
            </div>
          </div>
        </div>

        <Space className="ml-4">
          <Button size="small" icon={<Edit className="w-4 h-4" />} onClick={() => showEditModal(expense)} />
          <Popconfirm title="Delete this expense?" onConfirm={() => deleteExpense(expense._id)}>
            <Button size="small" danger icon={<Trash2 className="w-4 h-4" />} />
          </Popconfirm>
        </Space>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading expenses..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Title level={3} className="m-0 text-gray-800">Expense History</Title>
        <Space wrap>
          <Button icon={<Download className="w-4 h-4" />} onClick={exportToExcel}>
            Export
          </Button>
          <Link to="/add-expense">
            <Button type="primary" icon={<Plus className="w-4 h-4" />}>
              Add Expense
            </Button>
          </Link>
        </Space>
      </div>

      {error && (
        <Alert message="Error" description={error} type="error" showIcon className="mb-6" />
      )}

      {/* Total Expense Card */}
      <Card className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500">
        <div className="flex items-center justify-between">
          <div>
            <Text type="secondary">Total Expenses</Text>
            <Title level={2} className="m-0 text-red-600">
              ₹{totalExpense.toLocaleString('en-IN')}
            </Title>
          </div>
          <DollarSign className="w-12 h-12 text-red-500 opacity-80" />
        </div>
      </Card>

      {/* Mobile: Cards | Desktop: Table */}
      <div className="block md:hidden">
        {expenses.length === 0 ? (
          <Card className="text-center py-10 text-gray-500">
            No expenses yet. <Link to="/add-expense" className="text-blue-600">Add one!</Link>
          </Card>
        ) : (
          expenses.map((expense, index) => (
            <ExpenseCard key={expense._id} expense={expense} index={index} />
          ))
        )}
      </div>

      <div className="hidden md:block">
        <Card>
          <Table
            columns={[
              { title: 'S.No', render: (_, __, i) => i + 1, width: 70 },
              {
                title: 'Description',
                dataIndex: 'description',
                render: (text) => (
                  <Space>
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{text}</span>
                  </Space>
                )
              },
              {
                title: 'Amount',
                dataIndex: 'amount',
                render: (amt) => (
                  <Tag color="red" className="font-semibold">-₹{amt.toLocaleString('en-IN')}</Tag>
                )
              },
              {
                title: 'Paid By',
                dataIndex: 'paidBy',
                render: (text) => (
                  <Space>
                    <User className="w-4 h-4 text-gray-500" />
                    {text}
                  </Space>
                )
              },
              {
                title: 'Date',
                dataIndex: 'date',
                render: (date) => dayjs(date).format('DD MMM YYYY')
              },
              {
                title: 'Actions',
                render: (_, record) => (
                  <Space>
                    <Button size="small" icon={<Edit className="w-4 h-4" />} onClick={() => showEditModal(record)} />
                    <Popconfirm title="Delete?" onConfirm={() => deleteExpense(record._id)}>
                      <Button size="small" danger icon={<Trash2 className="w-4 h-4" />} />
                    </Popconfirm>
                  </Space>
                )
              }
            ]}
            dataSource={expenses}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'No expenses found' }}
          />
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal
        title="Edit Expense"
        open={editModalVisible}
        onCancel={() => { setEditModalVisible(false); form.resetFields(); }}
        footer={null}
        width={500}
      >
        <Form form={form} onFinish={handleEdit} layout="vertical">
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input prefix={<MessageSquare className="text-gray-400" />} />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <Input prefix={<DollarSign className="text-gray-400" />} type="number" />
          </Form.Item>
          <Form.Item name="paidBy" label="Paid By" rules={[{ required: true }]}>
            <Input prefix={<User className="text-gray-400" />} />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker className="w-full" format="DD MMMM YYYY" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space>
              <Button type="primary" htmlType="submit">Update</Button>
              <Button onClick={() => setEditModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ExpenseList;