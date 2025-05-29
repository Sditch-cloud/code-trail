import React, { useState } from 'react';
import { List, Card, Descriptions, Tag, Pagination, Divider, Statistic, Row, Col, Typography } from 'antd';
import { ClockCircleOutlined, UserOutlined, MinusSquareOutlined, PlusSquareOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface CommitInfo {
  id: string;
  message: string;
  author: string;
  email: string;
  time: number;
  formatted_time: string;
  lines_added: number;
  lines_deleted: number;
  files_changed?: number;
}

interface SearchResultProps {
  commits: CommitInfo[];
  author: string;
  dateRange: [string, string]; // 格式化后的日期字符串
  loading?: boolean;
}

const SearchResult: React.FC<SearchResultProps> = ({
  commits = [],
  author = '',
  dateRange = ['', ''],
  loading = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 计算统计数据
  const totalCommits = commits.length;
  const totalAdditions = commits.reduce((sum, commit) => sum + commit.lines_added, 0);
  const totalDeletions = commits.reduce((sum, commit) => sum + commit.lines_deleted, 0);
  const totalChanges = totalAdditions + totalDeletions;

  // 分页处理
  const paginatedCommits = commits.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="search-result-container">
      {/* 统计信息部分 */}
      <Card className="summary-card" style={{ marginBottom: 24 }} loading={loading}>
        <Title level={4}>检索结果汇总</Title>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic 
              title="提交总数" 
              value={totalCommits} 
              prefix={<ClockCircleOutlined />} 
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="新增行数" 
              value={totalAdditions} 
              valueStyle={{ color: '#3f8600' }}
              prefix={<PlusSquareOutlined />} 
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="删除行数" 
              value={totalDeletions}
              valueStyle={{ color: '#cf1322' }}
              prefix={<MinusSquareOutlined />} 
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="修改总行数" 
              value={totalChanges}
            />
          </Col>
        </Row>
        
        <Divider />
        
        <Descriptions>
          <Descriptions.Item label="提交者">{author || '全部'}</Descriptions.Item>
          <Descriptions.Item label="检索时间段">
            {dateRange[0] && dateRange[1]
              ? `${dateRange[0]} 至 ${dateRange[1]}`
              : '全部时间'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Commit 列表部分 */}
      <List
        loading={loading}
        itemLayout="vertical"
        dataSource={paginatedCommits}
        renderItem={(commit) => (
          <List.Item
            key={commit.id}
            extra={
              <div style={{ textAlign: 'right' }}>
                <div style={{ marginBottom: 8 }}>
                  <Tag color="green">+{commit.lines_added}</Tag>
                  <Tag color="red">-{commit.lines_deleted}</Tag>
                </div>
                {commit.files_changed && (
                  <Text type="secondary">{commit.files_changed} 文件变更</Text>
                )}
              </div>
            }
          >
            <List.Item.Meta
              title={
                <div style={{ wordBreak: 'break-all' }}>
                  <Text strong>{commit.message}</Text>
                </div>
              }
              description={
                <div>
                  <Text type="secondary" style={{ marginRight: 16 }}>
                    <UserOutlined /> {commit.author}
                  </Text>
                  <Text type="secondary">
                    <ClockCircleOutlined /> {commit.formatted_time}
                  </Text>
                </div>
              }
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" copyable={{ text: commit.id }}>
                提交 ID: {commit.id.substring(0, 8)}...
              </Text>
            </div>
          </List.Item>
        )}
        pagination={false}
      />
      
      {/* 分页控制 */}
      {commits.length > 0 && (
        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={commits.length}
            onChange={handlePageChange}
            showSizeChanger={false}
            showTotal={(total) => `共 ${total} 条记录`}
          />
        </div>
      )}
    </div>
  );
};

export default SearchResult;