import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const result = await login(email, password);
      
      if (result.user.role === "REPORTER") {
        navigate("/reporter");
      } else if (result.user.role === "RESOLVER") {
        navigate("/resolver");
      }
    } catch (err) {
      setError("Login failed - check credentials");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6">Login</h1>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="reporter@test.com or resolver@test.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded"
          />
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
            Sign In
          </button>
        </form>

        <div className="mt-6 text-sm">
          <p className="font-semibold mb-2">Test accounts:</p>
          <p>reporter@test.com / password</p>
          <p>resolver@test.com / password</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
