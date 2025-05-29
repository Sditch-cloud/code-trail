import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import SearchCondition from "./component/SearchCondition";
import SearchResult from './component/SearchResult';

function App() {
  const [commits, setCommits] = useState<any[]>([]);
  const [searchAuthor, setSearchAuthor] = useState('');
  const [searchDateRange, setSearchDateRange] = useState<[string, string]>(['', '']);
  const [loading, setLoading] = useState(false);

  const customTheme = {
    token: {
      fontFamily: '"Noto Sans SC", sans-serif',
    },
  };

  const handleSearch = async (values: {
    gitPath: string;
    author: string;
    dateRange: [number, number];
  }) => {
    try {
      setLoading(true);
      const response = await invoke("search_git", {
        gitPath: values.gitPath,
        author: values.author,
        startDate: values.dateRange[0],
        endDate: values.dateRange[1],
      })
      console.log("Search response:", response);
      setCommits(response as any[]);
      setSearchAuthor(values.author || '');
      setSearchDateRange([
        values.dateRange[0] ? new Date(values.dateRange[0] * 1000).toLocaleDateString() : '',
        values.dateRange[1] ? new Date(values.dateRange[1] * 1000).toLocaleDateString() : ''
      ]);
    } catch (error) {
      console.error('搜索出错:', error);
      setSearchAuthor('');
      setSearchDateRange(['', '']);
      setCommits([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConfigProvider locale={zhCN} theme={customTheme}>
      <SearchCondition onSearch={handleSearch}/>
      <SearchResult
        commits={commits}
        author={searchAuthor}
        dateRange={searchDateRange}
        loading={loading} />
    </ConfigProvider>
  );
}

export default App;
