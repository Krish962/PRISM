import { useNavigate } from "react-router-dom";

function HomePage() {
    const navigate = useNavigate();

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)",
                fontFamily: "sans-serif",
                padding: "24px"
            }}
        >
            <div
                style={{
                    maxWidth: "760px",
                    width: "100%",
                    background: "rgba(255,255,255,0.9)",
                    borderRadius: "20px",
                    boxShadow: "0 20px 45px rgba(15, 23, 42, 0.12)",
                    padding: "48px 32px",
                    textAlign: "center"
                }}
            >
                <h1 style={{ fontSize: "3rem", margin: 0, color: "#0f172a" }}>PRISM</h1>

                <p
                    style={{
                        marginTop: "16px",
                        marginBottom: "32px",
                        color: "#475569",
                        fontSize: "1.05rem",
                        lineHeight: "1.7"
                    }}
                >
                    PRISM — Paddy Rice Integrated Simulation Model is a web-based platform designed to simulate and analyze rice crop growth and productivity under different environmental and management conditions.

                    PRISM integrates crop, soil, weather, irrigation, and fertilizer information to run rice crop simulations and provide insights into key outcomes such as yield, biomass, crop growth, water use, and nitrogen uptake.

                    The platform is designed to help users understand how different agricultural management practices and environmental conditions can influence rice production, supporting data-driven and sustainable crop management decisions.
                </p>

                <div
                    style={{
                        display: "flex",
                        gap: "20px",
                        justifyContent: "center",
                        flexWrap: "wrap"
                    }}
                >
                    <button
                        onClick={() => navigate("/simulation")}
                        style={{
                            minWidth: "220px",
                            padding: "16px 24px",
                            borderRadius: "12px",
                            border: "none",
                            background: "#2563eb",
                            color: "#fff",
                            fontSize: "1rem",
                            fontWeight: 600,
                            cursor: "pointer"
                        }}
                    >
                        Single Simulation
                    </button>

                    <button
                        onClick={() => navigate("/batch")}
                        style={{
                            minWidth: "220px",
                            padding: "16px 24px",
                            borderRadius: "12px",
                            border: "none",
                            background: "#0f766e",
                            color: "#fff",
                            fontSize: "1rem",
                            fontWeight: 600,
                            cursor: "pointer"
                        }}
                    >
                        Batch Simulation
                    </button>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
