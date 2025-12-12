import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { email, full_name, password, confirmPassword } = formData;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/register', {
        email,
        full_name,
        password
      });
      
      console.log('Registration successful:', response.data);
      alert('Регистрация успешна! Теперь вы можете войти в систему.');
      navigate('/login');
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.detail || 
        err.message || 
        'Ошибка при регистрации. Попробуйте еще раз.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🌾 HarvestAI</h1>
        <h2 style={styles.subtitle}>Создание аккаунта</h2>
        
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Полное имя</label>
            <input
              type="text"
              name="full_name"
              value={full_name}
              onChange={handleChange}
              placeholder="Иван Иванов"
              style={styles.input}
              required
              disabled={loading}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              placeholder="user@example.com"
              style={styles.input}
              required
              disabled={loading}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Пароль</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={handleChange}
              placeholder="Минимум 6 символов"
              style={styles.input}
              required
              disabled={loading}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Подтверждение пароля</label>
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleChange}
              placeholder="Повторите пароль"
              style={styles.input}
              required
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <div style={styles.links}>
          <p>
            Уже есть аккаунт?{' '}
            <Link to="/login" style={styles.link}>
              Войти
            </Link>
          </p>
          <p>
            <Link to="/" style={styles.link}>
              ← Вернуться на главную
            </Link>
          </p>
        </div>
        
        <div style={styles.info}>
          <h4>Что дает регистрация?</h4>
          <ul style={styles.list}>
            <li>Создание карт удобрений для ваших полей</li>
            <li>История рекомендаций и аналитика</li>
            <li>Сохранение данных между сессиями</li>
            <li>Экспорт отчетов в различных форматах</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '500px'
  },
  title: {
    textAlign: 'center',
    color: '#2e7d32',
    marginBottom: '10px'
  },
  subtitle: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px',
    fontSize: '1.5rem'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '5px',
    marginBottom: '20px',
    borderLeft: '4px solid #c62828'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '16px',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s'
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#2e7d32',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    marginTop: '10px'
  },
  links: {
    marginTop: '25px',
    textAlign: 'center',
    color: '#666'
  },
  link: {
    color: '#2e7d32',
    textDecoration: 'none',
    fontWeight: '600'
  },
  info: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
    borderLeft: '4px solid #2e7d32'
  },
  list: {
    margin: '10px 0',
    paddingLeft: '20px',
    color: '#555'
  }
};

export default Register;