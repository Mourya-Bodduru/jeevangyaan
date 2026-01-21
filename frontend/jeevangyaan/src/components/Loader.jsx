import "../styles/Loader.css";
import jg from "../assets/jg.png";

const Loader = () => {
  return (
    <div className="loader-container">
      <img src={jg} alt="Jeevan Gyaan Logo" className="loader-logo" />
      <h1 className="loader-text">Jeevan Gyaan</h1>
    </div>
  );
};

export default Loader;
