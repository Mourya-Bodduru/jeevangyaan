import "../styles/Loader.css";
import jg from "../assets/jg.png";

const Loader = () => {
  return (
    <div className="loader-container">
      <div className="loader-content">
        <div className="spinner-ring outer"></div>
        <div className="spinner-ring inner"></div>
        <div className="logo-wrapper">
          <img src={jg} alt="Jeevan Gyaan Logo" className="loader-logo" />
        </div>
      </div>
      <h1 className="loader-text">
        <span>J</span><span>e</span><span>e</span><span>v</span><span>a</span><span>n</span>
        &nbsp;
        <span>G</span><span>y</span><span>a</span><span>a</span><span>n</span>
      </h1>
      <div className="loading-dots">
        <span>.</span><span>.</span><span>.</span>
      </div>
    </div>
  );
};

export default Loader;
