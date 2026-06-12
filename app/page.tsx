"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

// 1. Define the Metric interface so TypeScript is happy
interface Metric {
  id: string;
  name: string;
  category: string;
  passed: boolean;
}

export default function SecureScorePlatform() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState('BC Technologies');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  
  // 2. Apply the interface to the state
  const [metrics, setMetrics] = useState<Metric[]>([]);
  
  const [newFieldName, setNewFieldName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('identity');

  useEffect(() => {
    async function loadDashboardData() {
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('*')
        .limit(1)
        .single();

      if (tenantData) {
        setTenantId(tenantData.id);
        setTenantName(tenantData.company_name);
        setPrimaryColor(tenantData.primary_color);

        const { data: metricsData } = await supabase
          .from('tenant_metrics')
          .select('*')
          .eq('tenant_id', tenantData.id)
          .order('id', { ascending: true });

        if (metricsData) {
          const formattedMetrics: Metric[] = metricsData.map((m: any) => ({
            id: m.id,
            name: m.field_name,
            category: m.category,
            passed: m.is_passed,
          }));
          setMetrics(formattedMetrics);
        }
      }
    }
    loadDashboardData();
  }, []);

  const calculateCategoryScore = (category: string) => {
    const categoryFields = metrics.filter(m => m.category === category);
    if (categoryFields.length === 0) return 0;
    const passedFields = categoryFields.filter(m => m.passed);
    return Math.round((passedFields.length / categoryFields.length) * 100);
  };

  const identityScore = calculateCategoryScore('identity');
  const dataScore = calculateCategoryScore('data');
  const deviceScore = calculateCategoryScore('device');
  const appScore = calculateCategoryScore('app');
  
  const overallTenantScore = metrics.length === 0 ? 0 : Math.round((identityScore + dataScore + deviceScore + appScore) / 4);

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim() || !tenantId) return;
    
    const { data, error } = await supabase
      .from('tenant_metrics')
      .insert([
        {
          tenant_id: tenantId,
          field_name: newFieldName,
          category: selectedCategory,
          is_passed: false
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Database Insert Error:", error.message);
      return;
    }

    const newMetric: Metric = {
      id: data.id,
      name: data.field_name,
      category: data.category,
      passed: data.is_passed
    };

    setMetrics([...metrics, newMetric]);
    setNewFieldName('');
  };

  const toggleMetricStatus = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    const { error } = await supabase
      .from('tenant_metrics')
      .update({ is_passed: newStatus })
      .eq('id', id);

    if (error) {
      console.error("Update Error:", error.message);
      return;
    }

    setMetrics(metrics.map(metric => 
      metric.id === id ? { ...metric, passed: newStatus } : metric
    ));
  };

  const deleteMetric = async (id: string) => {
    const { error } = await supabase
      .from('tenant_metrics')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Delete Error:", error.message);
      return;
    }

    setMetrics(metrics.filter(metric => metric.id !== id));
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="w-64 bg-gray-950 border-r border-gray-800 p-6 flex flex-col justify-between">
        <div>
          <div className="text-xl font-bold tracking-tight mb-8" style={{ color: primaryColor }}>
            {tenantName}
          </div>
          <nav className="space-y-2">
            <a href="#" className="block px-4 py-2.5 rounded bg-gray-900 text-white font-medium">Dashboard Overview</a>
            <a href="#" className="block px-4 py-2.5 rounded text-gray-400 hover:bg-gray-900 hover:text-white transition">Tenant Configuration</a>
            <a href="#" className="block px-4 py-2.5 rounded text-gray-400 hover:bg-gray-900 hover:text-white transition">Global Rules Engine</a>
          </nav>
        </div>
        
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Simulate Client Brand</p>
          <input 
            type="text" 
            value={tenantName} 
            onChange={(e) => setTenantName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <header className="mb-8 border-b border-gray-800 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Secure Score Workspace</h1>
            <p className="text-gray-400 text-sm">Aggregated health tracking across connected infrastructure tenants.</p>
          </div>
          <div className="text-right">
            <span className="text-xs bg-green-900/40 text-green-400 border border-green-800 px-2.5 py-1 rounded-full font-mono">
              System Connected
            </span>
          </div>
        </header>

        <div className="bg-gray-950 p-6 rounded-xl border border-gray-800 mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">Overall Security Posture</h2>
            <p className="text-gray-400 text-sm max-w-md">
              Unweighted mean optimization composite across identity structures, localized device profiles, application sandboxes, and cloud storage objects.
            </p>
          </div>
          <div className="flex items-center justify-center w-32 h-32 rounded-full border-4 border-gray-800 relative shadow-lg">
            <div className="text-3xl font-extrabold" style={{ color: primaryColor }}>{overallTenantScore}%</div>
            <div className="text-[10px] text-gray-500 absolute bottom-5 font-medium uppercase tracking-widest">Score</div>
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="60" cy="60" r="56" fill="transparent" stroke="#1f2937" strokeWidth="8" />
              <circle cx="60" cy="60" r="56" fill="transparent" stroke={primaryColor} strokeWidth="8" strokeDasharray={351.8} strokeDashoffset={351.8 - (351.8 * overallTenantScore) / 100} className="transition-all duration-1000 ease-out" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'Identity Score', score: identityScore, tag: 'identity' },
            { title: 'Data Score', score: dataScore, tag: 'data' },
            { title: 'Device Score', score: deviceScore, tag: 'device' },
            { title: 'App Score', score: appScore, tag: 'app' }
          ].map((cat) => (
            <div key={cat.title} className="bg-gray-950 p-5 rounded-xl border border-gray-800">
              <h3 className="text-gray-400 font-medium text-sm mb-2">{cat.title}</h3>
              <div className="text-2xl font-bold mb-3">{cat.score}%</div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-500" style={{ width: `${cat.score}%`, backgroundColor: primaryColor }}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-950 p-6 rounded-xl border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">Manage Custom Audits & Controls</h3>
          
          <form onSubmit={handleAddField} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Metric Control Name</label>
              <input 
                type="text" 
                placeholder="e.g., Session Timeout Policy"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Target Dimension Pillar</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="identity">Identity Score Pillar</option>
                <option value="data">Data Score Pillar</option>
                <option value="device">Device Score Pillar</option>
                <option value="app">App Score Pillar</option>
              </select>
            </div>
            <div className="flex items-end">
              <button 
                type="submit" 
                className="w-full text-sm font-semibold text-white px-4 py-2 rounded transition hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                Inject Tracking Parameter
              </button>
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-gray-900 text-gray-300 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-3">Control Description Mapping</th>
                  <th className="p-3">Category Classification</th>
                  <th className="p-3">Audit State</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {metrics.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500 italic">No metrics found. Add a control above.</td>
                  </tr>
                ) : (
                  metrics.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-900/50 transition group">
                      <td className="p-3 text-white font-medium">{item.name}</td>
                      <td className="p-3 capitalize text-xs font-mono">{item.category}</td>
                      <td className="p-3">
                        <button 
                          onClick={() => toggleMetricStatus(item.id, item.passed)}
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold cursor-pointer transition-transform hover:scale-105 active:scale-95 ${
                            item.passed ? 'bg-green-950 text-green-400 border border-green-900' : 'bg-red-950 text-red-400 border border-red-900'
                          }`}
                        >
                          {item.passed ? 'Compliant (Passed)' : 'Action Required'}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => deleteMetric(item.id)}
                          className="text-xs font-medium text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}