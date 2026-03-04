import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>404</h1>
      <p>Página não encontrada.</p>
      <p>
        <Link to="/">Voltar para a página inicial</Link>
      </p>
    </div>
  );
};

export default NotFound;
