'use client';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { AiOutlineWarning } from 'react-icons/ai';

export default function Page() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const loginButtonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');

    if (!name || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          password
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }

//      // ⭐ No token is stored client-side anymore (HttpOnly cookie)
    //  sessionStorage.setItem('username', name.toUpperCase());
      // use the confirmed data from the server.
    if (data.user) {
      sessionStorage.setItem('username', data.user.username.toUpperCase());
      sessionStorage.setItem('userid', data.user.userid.toString());
    }



      router.push('/dashboard');

    } catch (err) {
      console.error(err);
      setError('Something went wrong');
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const caps = e.getModifierState && e.getModifierState('CapsLock');
    setCapsLock(caps);
  };

  const handleUsernameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && passwordInputRef.current) {
      e.preventDefault();
      passwordInputRef.current.focus();
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleKey(e);
    if (e.key === 'Enter' && loginButtonRef.current) {
      e.preventDefault();
      loginButtonRef.current.click();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <form
        onSubmit={handleSubmit}
        className="p-8 bg-white rounded shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Username input */}
        <input
          type="text"
          placeholder="Username"
          value={name}
          onChange={(e) => setName(e.target.value.toUpperCase())}
          onKeyDown={handleUsernameKeyDown}
          autoFocus
          className="w-full mb-4 p-2 border rounded"
        />

        {/* Password */}
        <div className="relative mb-2">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handlePasswordKeyDown}
            ref={passwordInputRef}
            className="w-full p-2 border rounded pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {/* Caps Lock */}
        {capsLock && (
          <div className="flex items-center text-yellow-600 mb-4">
            <AiOutlineWarning className="mr-1" />
            <span className="text-sm">Caps Lock On</span>
          </div>
        )}

        <button
          type="submit"
          ref={loginButtonRef}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}
