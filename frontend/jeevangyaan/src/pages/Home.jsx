import { Link } from "react-router-dom";
import "../styles/Home.css";
const Home = () => {
  return (
    <>
      <section className="hero">
        <h1>
          Master Life Skills for <br />
          <span>Real-World Success</span>
        </h1>

        <p>
          Learn essential civic responsibilities, digital safety, and social
          skills through interactive modules, AI-generated stories, and
          personalized guidance.
        </p>

        <div className="hero-buttons">
          <Link to="/login" className="btn-primary">Start Learning Free</Link>
          <Link to="/modules" className="btn-outline">View All Modules</Link>
        </div>
      </section>

      <section className="features">
                <h2>
                Why Choose <span>JeevanGyaan?</span>
                </h2>
            <div className="col-12 ">
                <div className="feature-cards">

                <div className="col-4 card">
                    <h3>📘 Interactive Modules</h3>
                    <p>Learn real-life skills through structured, engaging lessons.</p>
                </div>

                <div className="col-4 card">
                    <h3>✨ AI-Generated Stories</h3>
                    <p>Understand concepts through relatable life scenarios.</p>
                </div>

                <div className="col-4 card">
                    <h3>💬 24/7 AI Assistant</h3>
                    <p>Get instant help and guidance anytime.</p>
                </div>
            </div>
            <div className="col-12">
                <div className="feature-cards">
                <div className="card">
                    <h3>📊 Track Progress</h3>
                    <p>Monitor your learning journey and achievements.</p>
                </div>

                    <div className="card">
                    <h3>Essential Topics</h3>
                    <p>Learn about civic responsibilities, digital safety, and social skills.</p>
                </div>

                <div className="card">
                    <h3>NEP 2020 </h3>
                    <p>Aligned with national education policy</p>
                </div>
                </div>
            </div>
                </div>
      </section>

    <section className="call-to-action">
      <div className="cta-content">
        <h2>Ready to Transform Your Life Skills?</h2>
        <p>Join JeevanGyaan today and embark on a journey of practical learning and personal growth!</p>
        <Link to="/register" className="btn-action">Get Started Now</Link>
      </div>

    </section><br /><br />
    </>
  );
};

export default Home;
