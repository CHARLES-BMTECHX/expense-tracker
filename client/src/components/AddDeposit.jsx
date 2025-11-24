import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, DatePicker, Card, Row, Col } from 'antd';
import { User, DollarSign, Calendar ,Plus} from 'lucide-react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

function AddDeposit() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      const payload = {
        name: values.name,
        amount: values.amount,
        date: dayjs(values.date).toISOString(),
      };
      await axios.post(`${API_BASE}/deposits`, payload);
      toast.success('Deposit added successfully!');
      navigate('/deposits');
    } catch (err) {
      console.error(err);
      toast.error('Error adding deposit. Please try again.');
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
    toast.error('Please fill all fields correctly.');
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <div className="">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Add New Deposit</h2>
        <Form
          form={form}
          name="addDeposit"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          layout="vertical"
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Please enter the name' }]}
              >
                <Input
                  prefix={<User className="w-4 h-4 text-gray-400" />}
                  placeholder="Enter name"
                  className="rounded-md"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="amount"
                label="Amount"
                rules={[{ required: true, message: 'Please enter the amount' }]}
              >
                <Input
                  prefix={<DollarSign className="w-4 h-4 text-gray-400" />}
                  type="number"
                  placeholder="Enter amount"
                  className="rounded-md"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="date"
                label="Date"
                rules={[{ required: true, message: 'Please select the date' }]}
              >
                <DatePicker
                  className="w-full rounded-md"
                  placeholder="Select date"
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              className="rounded-md"
              icon={<Plus className="w-4 h-4" />}
            >
              Add Deposit
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default AddDeposit;