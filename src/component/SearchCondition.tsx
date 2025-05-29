import { invoke } from "@tauri-apps/api/core";
import {
  AutoComplete,
  AutoCompleteProps,
  Button,
  DatePicker,
  Form,
  FormInstance,
  FormProps,
  GetProps,
  Input,
} from "antd";
import { PropsWithChildren, useEffect, useState } from "react";
import FolderSelector from "./FolderSelector";

const { RangePicker } = DatePicker;

type RangePickerProps = GetProps<typeof DatePicker.RangePicker>;
type FieldType = {
  gitPath: string;
  author: string;
  dateRange: RangePickerProps["value"];
};

interface SubmitButtonProps {
  form: FormInstance;
}

const SubmitButton = ({
  form,
  children,
}: PropsWithChildren<SubmitButtonProps>) => {
  const [submittable, setSubmittable] = useState<boolean>(false);

  const values = Form.useWatch([], form);

  useEffect(() => {
    form
      .validateFields({ validateOnly: true })
      .then(() => setSubmittable(true))
      .catch(() => setSubmittable(false));
  }, [form, values]);

  return (
    <Button type="primary" htmlType="submit" disabled={!submittable}>
      {children}
    </Button>
  );
};

interface SearchConditionProps {
  onSearch: (values: {
    gitPath: string;
    author: string;
    dateRange: [number, number];
  }) => void;
}

const SearchCondition = ({ onSearch }: SearchConditionProps) => {
  const [form] = Form.useForm();
  const [options, setOptions] = useState<AutoCompleteProps["options"]>([]);

  const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
    onSearch({
      gitPath: values.gitPath,
      author: values.author || "",
      dateRange: [
        values.dateRange?.[0]?.unix() || 0,
        values.dateRange?.[1]?.unix() || 0,
      ],
    });
  };

  const onFinishFailed: FormProps<FieldType>["onFinishFailed"] = (
    errorInfo
  ) => {
    console.log("Failed:", errorInfo);
  };

  const onBlur: React.FocusEventHandler<HTMLInputElement> = async (e) => {
    console.log("Input blurred:", e.target.value);
    try {
      const response = await invoke("get_contributors", {
        gitPath: e.target.value,
      });
      console.log("Contributor response:", response);
      setOptions(
        (response as string[]).map((author) => ({
          value: author,
          label: author,
        }))
      );
    } catch (error) {
      console.error("获取贡献者列表失败:", error);
      setOptions([]);
    }
  };

  return (
    <Form
      form={form}
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 24 }}
      layout="horizontal"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item<FieldType>
        label="Git仓库路径"
        name="gitPath"
        rules={[{ required: true, message: "请选择 Git 仓库路径" }]}
      >
        <FolderSelector placeholder="点击按钮选择 Git 仓库文件夹" />
      </Form.Item>
      <Form.Item<FieldType> label="提交者" name="author">
        <AutoComplete options={options} />
      </Form.Item>
      <Form.Item<FieldType>
        label="提交时间范围"
        name="dateRange"
        rules={[{ required: true }]}
      >
        <RangePicker />
      </Form.Item>
      <Form.Item label={null}>
        <SubmitButton form={form}>检索</SubmitButton>
      </Form.Item>
    </Form>
  );
};

export default SearchCondition;
