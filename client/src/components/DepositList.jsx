import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Tag,
  Space,
  Popconfirm,
  Card,
  Row,
  Col,
  Spin,
  Alert,
  Typography,
  Table,
  Divider,
} from "antd";
import {
  Edit,
  Trash2,
  User,
  DollarSign,
  Calendar,
  Plus,
  Download,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const { Title, Text } = Typography;
const API_BASE = "http://localhost:5000/api";

function DepositList() {
  const [deposits, setDeposits] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE}/deposits`);
      setDeposits(res.data.deposits || []);
      setTotalAmount(res.data.totalAmount || 0);
    } catch (err) {
      setError("Failed to fetch deposits.");
      toast.error("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (deposits.length === 0) return toast.error("No data to export");

    const data = deposits.map((d, i) => ({
      "S.No": i + 1,
      Name: d.name,
      Amount: d.amount,
      Date: dayjs(d.date).format("DD MMM YYYY"),
    }));

    const ws = XLSX.utils.json_to_sheet([
      { Name: "TOTAL AMOUNT", Amount: totalAmount },
      {},
      ...data,
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Deposits");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer]), "deposit_report.xlsx");
    toast.success("Downloaded!");
  };

  const deleteDeposit = async (id) => {
    try {
      await axios.delete(`${API_BASE}/deposits/${id}`);
      toast.success("Deleted!");
      fetchDeposits();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const showEditModal = (deposit) => {
    setEditingDeposit(deposit);
    form.setFieldsValue({
      name: deposit.name,
      amount: deposit.amount,
      date: dayjs(deposit.date),
    });
    setEditModalVisible(true);
  };

  const handleEdit = async (values) => {
    try {
      await axios.put(`${API_BASE}/deposits/${editingDeposit._id}`, {
        ...values,
        date: values.date.toISOString(),
      });
      toast.success("Updated!");
      setEditModalVisible(false);
      form.resetFields();
      fetchDeposits();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  // Mobile Card Component
  const DepositCard = ({ deposit, index }) => (
    <Card
      className="mb-4 shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow"
      key={deposit._id}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Text strong className="text-lg">
              {deposit.name}
            </Text>
            <Tag color="green" className="text-xs">
              #{index + 1}
            </Tag>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-green-600 font-semibold">
              <DollarSign className="w-4 h-4" />
              <span className="text-lg">
                ₹{deposit.amount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{dayjs(deposit.date).format("DD MMMM YYYY")}</span>
            </div>
          </div>
        </div>

        <Space className="ml-4">
          <Button
            size="small"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => showEditModal(deposit)}
          />
          <Popconfirm
            title="Delete this deposit?"
            onConfirm={() => deleteDeposit(deposit._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<Trash2 className="w-4 h-4" />} />
          </Popconfirm>
        </Space>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading deposits..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Title level={3} className="m-0">
          Deposit History
        </Title>
        <Space wrap>
          <Button
            icon={<Download className="w-4 h-4" />}
            onClick={exportToExcel}
          >
            Export
          </Button>
          <Link to="/add-deposit">
            <Button type="primary" icon={<Plus className="w-4 h-4" />}>
              Add Deposit
            </Button>
          </Link>
        </Space>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-6"
        />
      )}

      {/* Total Amount */}
      <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <Text type="secondary">Total Deposits</Text>
            <Title level={2} className="m-0 text-green-600">
              ₹{totalAmount.toLocaleString("en-IN")}
            </Title>
          </div>
          <DollarSign className="w-12 h-12 text-green-500 opacity-80" />
        </div>
      </Card>

      {/* Responsive: Cards on Mobile, Table on Desktop */}
      <div className="block md:hidden">
        {/* Mobile: Card View */}
        {deposits.length === 0 ? (
          <Card className="text-center py-10 text-gray-500">
            No deposits yet.{" "}
            <Link to="/add-deposit" className="text-blue-600">
              Add one!
            </Link>
          </Card>
        ) : (
          deposits.map((deposit, index) => (
            <DepositCard key={deposit._id} deposit={deposit} index={index} />
          ))
        )}
      </div>

      <div className="hidden md:block">
        {/* Desktop: Table View */}
        <Card>
          <Table
            columns={[
              { title: "S.No", render: (_, __, i) => i + 1, width: 70 },
              {
                title: "Name",
                dataIndex: "name",
                render: (text) => (
                  <Space>
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{text}</span>
                  </Space>
                ),
              },
              {
                title: "Amount",
                dataIndex: "amount",
                render: (amt) => (
                  <Tag color="green" className="font-semibold">
                    ₹{amt.toLocaleString("en-IN")}
                  </Tag>
                ),
              },
              {
                title: "Date",
                dataIndex: "date",
                render: (date) => dayjs(date).format("DD MMM YYYY"),
              },
              {
                title: "Actions",
                render: (_, record) => (
                  <Space>
                    <Button
                      size="small"
                      icon={<Edit className="w-4 h-4" />}
                      onClick={() => showEditModal(record)}
                    />
                    <Popconfirm
                      title="Delete?"
                      onConfirm={() => deleteDeposit(record._id)}
                    >
                      <Button
                        size="small"
                        danger
                        icon={<Trash2 className="w-4 h-4" />}
                      />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
            dataSource={deposits}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: "No deposits found" }}
          />
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal
        title="Edit Deposit"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleEdit} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input prefix={<User />} />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <Input prefix={<DollarSign />} type="number" />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space>
              <Button type="primary" htmlType="submit">
                Update
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default DepositList;
