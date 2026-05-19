import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await axios.get('https://backend-iota-brown-36.vercel.app/api/stats');
      if (response.data && response.data.length > 0) {
        setLatest(response.data[0]);
      }
    } catch (error) {
      console.error('Помилка завантаження даних:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);
const getLightState = (lux) => {
    const l = Number(lux); 
    if (l < 500) return { label: '🌑 Затемно', colorClass: 'light-low' };

    if (l > 1000000) return { label: '☀️ Занадто яскраво', colorClass: 'light-high' };

    return { label: '🌤 Оптимально', colorClass: 'light-normal' };
  };

  const getPlantState = (value) => {
    const val = Number(value);
    if (val < 30) return { title: '💧 Полий!', note: 'Земля суха, варто зволожити.', toneClass: 'danger' };
    if (val > 80) return { title: '🌊 Перелив', note: 'Вологи забагато, полив краще відкласти.', toneClass: 'flood' };
    return { title: '🌱 Норма', note: 'Рівень вологості зараз комфортний.', toneClass: 'normal' };
  };

  if (loading) return <div className="screen-state"><div className="state-card"><p>⏳ Завантаження...</p></div></div>;
  if (!latest) return <div className="screen-state"><div className="state-card error"><p>❌ Дані відсутні</p></div></div>;

  const pot1Value = Number(latest.soil_moisture);
  const pot2Value = Number(latest.soil_moisture_2);
  const light = getLightState(latest.lux);

  const pot1 = getPlantState(pot1Value);
  const pot2 = getPlantState(pot2Value);

  return (
    <div className="app">
      <div className="mobile-shell">
        <header className="top-card">
          <div className="top-title-wrap">
            <p className="eyebrow">AgroMonitor</p>
            <h1>Моніторинг</h1>
          </div>

          <div className="env-grid">
            <div className="env-item">
              <span className="env-label">🌡 Температура середовища</span>
              <strong className="env-value">{latest.air_temp}°C</strong>
            </div>

            <div className="env-item">
              <span className="env-label">☁️ Вологість середовища</span>
              <strong className="env-value">{latest.air_humidity}%</strong>
            </div>

            {/* Оновлений блок освітленості */}
            <div className={`env-item ${light.colorClass}`}>
              <span className="env-label">💡 Освітленість</span>
              <strong className="env-value">{Number(latest.lux).toFixed(0)} lx</strong>
              <span className="light-status-text">{light.label}</span>
            </div>
          </div>
        </header>

        <section className="section-head">
          <h2>Стан ґрунту</h2>
        </section>

        <section className="plant-list">
          <article className={`plant-card ${pot1.toneClass}`}>
            <div className="plant-card-head">
              <span className="plant-name">🪴 Горщик 1</span>
            </div>
            <div className="plant-center">
              <div className="moisture-value">{pot1Value}%</div>
              <div className={`status-line ${pot1.toneClass}`}>{pot1.title}</div>
            </div>
            <div className="hint-box">
              <span className="hint-title">Порада</span>
              <p>{pot1.note}</p>
            </div>
          </article>

          <article className={`plant-card ${pot2.toneClass}`}>
            <div className="plant-card-head">
              <span className="plant-name">🪴 Горщик 2</span>
            </div>
            <div className="plant-center">
              <div className="moisture-value">{pot2Value}%</div>
              <div className={`status-line ${pot2.toneClass}`}>{pot2.title}</div>
            </div>
            <div className="hint-box">
              <span className="hint-title">Порада</span>
              <p>{pot2.note}</p>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

export default App;
