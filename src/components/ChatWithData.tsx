import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

type Props = { dataset: any };

const ChatWithData: React.FC<Props> = ({ dataset }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!dataset || !dataset.rows) return;
    setLoading(true);
    try {
      // 🔹 Direct OpenAI API call (no backend)
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer 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" // ⬅️ paste key here
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a data analysis assistant. The user gives a dataset and a question. Reply with insights, sample preview, and chart suggestions in JSON format."
            },
            {
              role: "user",
              content: JSON.stringify({
                question,
                data: dataset.rows.slice(0, 50) // send only sample to save tokens
              })
            }
          ],
          temperature: 0.2
        })
      });

      const j = await res.json();
      const content = j.choices?.[0]?.message?.content || "{}";

      // Expecting structured JSON
      const parsed = JSON.parse(content);

      setAnswer(parsed.answer || "No insights found.");
      setPreview(Array.isArray(parsed.data_preview) ? parsed.data_preview : []);
      setSuggestions(Array.isArray(parsed.charts) ? parsed.charts : []);
    } catch (e) {
      console.error(e);
      setAnswer("⚠️ Error: Could not reach OpenAI API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl border border-gray-800 bg-[#0F1418]">
      <div className="text-sm text-gray-200 mb-2">Chat with Data (AI-powered)</div>
      <div className="flex gap-2">
        <input
          className="flex-1 bg-black/40 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-100"
          placeholder="e.g., top 5 by revenue, sum of sales by region"
          value={question}
          onChange={e => setQuestion(e.target.value)}
        />
        <button onClick={ask} disabled={loading} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm">
          {loading ? "Asking..." : "Ask"}
        </button>
      </div>

      {answer && <div className="mt-3 text-gray-300 text-sm">💡 {answer}</div>}

      {preview.length > 0 && (
        <div className="mt-3 max-h-60 overflow-auto text-xs text-gray-200">
          <table className="min-w-full">
            <thead>
              <tr>
                {Object.keys(preview[0]).map((k) => (
                  <th key={k} className="text-left pr-3 py-1 border-b border-gray-700">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, idx) => (
                <tr key={idx}>
                  {Object.keys(preview[0]).map((k) => (
                    <td key={k} className="pr-3 py-1 border-b border-gray-800">{String(row[k])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-6 space-y-8">
          {suggestions.map((s, idx) => (
            <div key={idx}>{renderChart(s, dataset)}</div>
          ))}
        </div>
      )}
    </div>
  );
};

// 🔹 Chart rendering helper
const renderChart = (s: any, dataset: any) => {
  if (!s || !dataset?.rows) return null;
  const data = dataset.rows;

  switch (s.type) {
    case "bar":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={s.x} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={s.y} fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      );
    case "line":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={s.x} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={s.y} stroke="#10b981" />
          </LineChart>
        </ResponsiveContainer>
      );
    case "pie":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} dataKey={s.y} nameKey={s.x} cx="50%" cy="50%" outerRadius={100} label>
              {data.map((_: any, idx: number) => (<Cell key={idx} fill={["#3b82f6", "#10b981", "#f59e0b", "#ef4444"][idx % 4]} />))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    case "scatter":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid />
            <XAxis dataKey={s.x} />
            <YAxis dataKey={s.y} />
            <Tooltip />
            <Scatter data={data} fill="#8b5cf6" />
          </ScatterChart>
        </ResponsiveContainer>
      );
    default:
      return null;
  }
};

export default ChatWithData;

