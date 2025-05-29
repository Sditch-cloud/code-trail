import React, { useState } from 'react';
import { Input, Button, message, Space } from 'antd';
import { FolderOutlined } from '@ant-design/icons';
import { open } from '@tauri-apps/plugin-dialog';

interface FolderSelectorProps {
  value?: string;
  onChange?: (path: string) => void;
  placeholder?: string;
  width?: string | number;
}

const FolderSelector: React.FC<FolderSelectorProps> = ({
  value = '',
  onChange,
}) => {
  const [folderPath, setFolderPath] = useState(value);

  const handleSelectFolder = async () => {
    try {
      // 打开文件夹选择对话框
      const selected = await open({
        directory: true,
        multiple: false,
        title: '选择 Git 仓库文件夹',
      });

      // 如果用户选择了文件夹
      if (selected && !Array.isArray(selected)) {
        setFolderPath(selected);
        onChange?.(selected);
      }
    } catch (error) {
      console.error('选择文件夹出错:', error);
      message.error('选择文件夹失败');
    }
  };

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Button
        type="primary"
        icon={<FolderOutlined />}
        onClick={handleSelectFolder}
      />
      <Input
        value={folderPath}
        readOnly
        onClick={handleSelectFolder}
        placeholder="请选择文件夹"
      />
    </Space.Compact>
  );
};

export default FolderSelector;