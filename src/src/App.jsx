import { useMemo, useState } from "react";

const SAMPLE_VINS = {
  octavia_diesel_dsg: "TMBAJ8N7SM008730",
  octavia_petrol_dsg: "TMBAJ8NTTSA123456",
  superb_diesel_dsg: "TMBCR7NP1R7031716",
  kodiaq_diesel_dsg: "TMBLN7NS5N8514159",
};

const VEHICLE_PROFILES = {
  octavia_diesel_dsg: {
    marka: "Škoda",
    model: "Octavia IV",
    generation: "IV",
    motorKod: "DXRB",
    motor: "2.0 TDI 110 kW",
    fuelType: "Diesel",
    menjac: "DSG7",
    gearboxCode: "DQ381",
    drivetrain: "FWD",
    oilSpec: "VW 507 00",
    oilSae: "0W-30",
    oilCapacity: 5.1,
    hourlyRate: 5500,
    confidence: "high",
    matchType: "exact",
    serviceProfile: "octavia_diesel_dsg",
  },
  octavia_petrol_dsg: {
    marka: "Škoda",
    model: "Octavia IV",
    generation: "IV",
    motorKod: "DADA",
    motor: "1.5 TSI 110 kW",
    fuelType: "Petrol",
    menjac: "DSG7",
    gearboxCode: "DQ381",
    drivetrain: "FWD",
    oilSpec: "VW 508 00",
    oilSae: "0W-20",
    oilCapacity: 4.3,
    hourlyRate: 5500,
    confidence: "medium",
    matchType: "candidate",
    serviceProfile: "octavia_petrol_dsg",
  },
  superb_diesel_dsg: {
    marka: "Škoda",
    model: "Superb",
    generation: "IV",
    motorKod: "DTUA",
    motor: "2.0 TDI 147 kW",
    fuelType: "Diesel",
    menjac: "DSG7",
    gearboxCode: "DQ381",
    drivetrain: "FWD",
    oilSpec: "VW 507 00",
    oilSae: "0W-30",
    oilCapacity: 5.5,
    hourlyRate: 6800,
    confidence: "medium",
    matchType: "candidate",
    serviceProfile: "superb_diesel_dsg",
  },
  kodiaq_diesel_dsg: {
    marka: "Škoda",
    model: "Kodiaq",
    generation: "II",
    motorKod: "DTTC",
    motor: "2.0 TDI 147 kW",
    fuelType: "Diesel",
    menjac: "DSG7 4x4",
    gearboxCode: "DQ381 AWD",
    drivetrain: "AWD",
    oilSpec: "VW 507 00",
    oilSae: "0W-30",
    oilCapacity: 5.7,
    hourlyRate: 6800,
    confidence: "high",
    matchType: "exact",
    serviceProfile: "kodiaq_diesel_dsg",
  },
};

const EXPLOITATION_PROFILES = {
  rentacar: {
    label: "Rent a car",
    brakeFactor: 1.25,
    totalFactor: 1.18,
    recommendedFlex: 15000,
  },
  fleet_city: {
    label: "Fleet / gradska i mešovita vožnja",
    brakeFactor: 1.12,
    totalFactor: 1.08,
    recommendedFlex: 20000,
  },
  fleet_standard: {
    label: "Fleet / standard",
    brakeFactor: 1,
    totalFactor: 1,
    recommendedFlex: 25000,
  },
  highway: {
    label: "Autoput / laki uslovi",
    brakeFactor: 0.9,
    totalFactor: 0.95,
    recommendedFlex: 30000,
  },
};

function formatRsd(value) {
  return new Intl.NumberFormat("sr-RS", {
    style: "currency",
    currency: "RSD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatNum(value, digits = 1) {
  return new Intl.NumberFormat("sr-RS", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value || 0);
}

function decodeSkodaVin(vin) {
  const cleaned = vin.trim().toUpperCase();

  if (cleaned.length !== 17) {
    return {
      supported: false,
      reason: "VIN mora imati 17 karaktera.",
    };
  }

  if (!cleaned.startsWith("TMB")) {
    return {
      supported: false,
      reason: "Za sada je podržana samo Škoda (TMB).",
    };
  }

  const yearCode = cleaned[9];
  const years = {
    L: 2020,
    M: 2021,
    N: 2022,
    P: 2023,
    R: 2024,
    S: 2025,
    T: 2026,
  };

  let profile = null;

  if (cleaned.startsWith("TMBAJ8")) profile = VEHICLE_PROFILES.octavia_diesel_dsg;
  else if (cleaned.startsWith("TMBAJ8NT")) profile = VEHICLE_PROFILES.octavia_petrol_dsg;
  else if (cleaned.startsWith("TMBCR7")) profile = VEHICLE_PROFILES.superb_diesel_dsg;
  else if (cleaned.startsWith("TMBLN7")) profile = VEHICLE_PROFILES.kodiaq_diesel_dsg;

  if (!profile) {
    return {
      supported: true,
      marka: "Škoda",
      model: "Nepoznat model",
      generation: "-",
      motorKod: "-",
      motor: "Nepoznat motor",
      fuelType: "-",
      menjac: "-",
      gearboxCode: "-",
      drivetrain: "-",
      oilSpec: "-",
      oilSae: "-",
      oilCapacity: 0,
      hourlyRate: 5500,
      confidence: "low",
      matchType: "fallback",
      modelYear: years[yearCode] || "Nepoznato",
      serviceProfile: "generic",
    };
  }

  return {
    supported: true,
    ...profile,
    modelYear: years[yearCode] || "Nepoznato",
  };
}

function StatCard({ title, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{title}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div style={styles.infoCard}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

export default function App() {
  const [sessionUser] = useState({
    displayName: "Admin demo",
    company: "Ćirinac",
  });

  const [selectedProfileId, setSelectedProfileId] = useState("octavia_diesel_dsg");
  const [vin, setVin] = useState(SAMPLE_VINS.octavia_diesel_dsg);
  const [plannedKm, setPlannedKm] = useState(200000);
  const [contractMonths, setContractMonths] = useState(48);
  const [exploitationType, setExploitationType] = useState("fleet_standard");
  const [hourlyRate, setHourlyRate] = useState(5500);
  const [flexInterval, setFlexInterval] = useState(25000);
  const [laborDiscount, setLaborDiscount] = useState(0);
  const [partsDiscount, setPartsDiscount] = useState(0);
  const [oilDiscount, setOilDiscount] = useState(0);

  const decoded = useMemo(() => decodeSkodaVin(vin), [vin]);
  const exploitation = EXPLOITATION_PROFILES[exploitationType];

  const scenarioRows = useMemo(() => {
    if (!decoded.supported) return [];

    const annualKm = contractMonths > 0 ? (plannedKm / contractMonths) * 12 : 0;
    const baseFactor = exploitation.totalFactor;
    const discountFactor =
      1 - (laborDiscount * 0.25 + partsDiscount * 0.45 + oilDiscount * 0.3) / 100;

    const baseCost =
      plannedKm * 1.55 * baseFactor * discountFactor +
      (decoded.drivetrain === "AWD" ? 65000 : 0) +
      (decoded.fuelType === "Diesel" ? 35000 : 25000) +
      annualKm * 0.12;

    return [
      {
        label: "Optimistični",
        flex: Math.min(30000, flexInterval + 5000),
        brakeFactor: formatNum(exploitation.brakeFactor * 0.9, 2),
        total: baseCost * 0.93,
      },
      {
        label: "Očekivani",
        flex: flexInterval,
        brakeFactor: formatNum(exploitation.brakeFactor, 2),
        total: baseCost,
      },
      {
        label: "Konzervativni",
        flex: Math.max(15000, flexInterval - 5000),
        brakeFactor: formatNum(exploitation.brakeFactor * 1.12, 2),
        total: baseCost * 1.11,
      },
    ];
  }, [
    decoded,
    exploitation,
    plannedKm,
    contractMonths,
    flexInterval,
    laborDiscount,
    partsDiscount,
    oilDiscount,
  ]);

  const totalSale = scenarioRows[1]?.total || 0;
  const costPerKm = plannedKm ? totalSale / plannedKm : 0;
  const costPerMonth = contractMonths ? totalSale / contractMonths : 0;
  const totalService = totalSale * 0.68;
  const totalBrakes = totalSale * 0.32;
  const annualKm = contractMonths ? (plannedKm / contractMonths) * 12 : 0;

  const loadProfile = (profileId) => {
    setSelectedProfileId(profileId);
    setVin(SAMPLE_VINS[profileId]);
    setHourlyRate(VEHICLE_PROFILES[profileId]?.hourlyRate || 5500);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.hero}>
          <div>
            <div style={styles.heroBadge}>Demo licensed environment</div>
            <h1 style={styles.heroTitle}>Fleet Maintenance &amp; TCO Calculator</h1>
            <div style={styles.heroSubtitle}>
              Škoda-only kalkulator za leasing, rent-a-car i fleet operacije.
            </div>
          </div>

          <div style={styles.heroMetaWrap}>
            <div style={styles.heroMetaCard}>
              <div style={styles.heroMetaLabel}>KORISNIK</div>
              <div style={styles.heroMetaValue}>{sessionUser.displayName}</div>
            </div>
            <div style={styles.heroMetaCard}>
              <div style={styles.heroMetaLabel}>KOMPANIJA</div>
              <div style={styles.heroMetaValue}>{sessionUser.company}</div>
            </div>
            <button style={styles.logoutBtn}>Logout</button>
          </div>
        </div>

        <div style={styles.mainGrid}>
          <div style={styles.sidebarCard}>
            <h2 style={styles.sectionTitle}>Fleet TCO Calculator</h2>

            <label style={styles.label}>Način izbora vozila</label>
            <select style={styles.input}>
              <option>VIN dekoder</option>
            </select>

            <label style={styles.label}>Test profil</label>
            <select
              style={styles.input}
              value={selectedProfileId}
              onChange={(e) => loadProfile(e.target.value)}
            >
              <option value="octavia_diesel_dsg">Octavia 2.0 TDI DSG</option>
              <option value="octavia_petrol_dsg">Octavia 1.5 TSI DSG</option>
              <option value="superb_diesel_dsg">Superb 2.0 TDI DSG</option>
              <option value="kodiaq_diesel_dsg">Kodiaq 2.0 TDI DSG 4x4</option>
            </select>

            <label style={styles.label}>VIN</label>
            <input style={styles.input} value={vin} onChange={(e) => setVin(e.target.value)} />

            <div style={styles.twoCol}>
              <div>
                <label style={styles.label}>Planirana kilometraža</label>
                <input
                  style={styles.input}
                  type="number"
                  value={plannedKm}
                  onChange={(e) => setPlannedKm(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label style={styles.label}>Trajanje ugovora</label>
                <input
                  style={styles.input}
                  type="number"
                  value={contractMonths}
                  onChange={(e) => setContractMonths(Number(e.target.value) || 0)}
                />
              </div>
            </div>

            <label style={styles.label}>Tip eksploatacije</label>
            <select
              style={styles.input}
              value={exploitationType}
              onChange={(e) => setExploitationType(e.target.value)}
            >
              {Object.entries(EXPLOITATION_PROFILES).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>

            <div style={styles.twoCol}>
              <div>
                <label style={styles.label}>Cena radnog sata (RSD)</label>
                <input
                  style={styles.input}
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label style={styles.label}>Fleksibilni servisni interval</label>
                <select
                  style={styles.input}
                  value={flexInterval}
                  onChange={(e) => setFlexInterval(Number(e.target.value))}
                >
                  <option value={15000}>15.000 km</option>
                  <option value={20000}>20.000 km</option>
                  <option value={25000}>25.000 km</option>
                  <option value={30000}>30.000 km</option>
                </select>
              </div>
            </div>

            <div style={styles.threeCol}>
              <div>
                <label style={styles.label}>Rabat rad %</label>
                <input
                  style={styles.input}
                  type="number"
                  value={laborDiscount}
                  onChange={(e) => setLaborDiscount(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label style={styles.label}>Rabat delovi %</label>
                <input
                  style={styles.input}
                  type="number"
                  value={partsDiscount}
                  onChange={(e) => setPartsDiscount(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label style={styles.label}>Rabat ulje %</label>
                <input
                  style={styles.input}
                  type="number"
                  value={oilDiscount}
                  onChange={(e) => setOilDiscount(Number(e.target.value) || 0)}
                />
              </div>
            </div>

            <div style={styles.buttonRow}>
              <button style={styles.secondaryBtn} onClick={() => setPlannedKm(120000)}>
                120.000 km
              </button>
              <button style={styles.secondaryBtn} onClick={() => setPlannedKm(200000)}>
                200.000 km
              </button>
              <button
                style={styles.secondaryBtn}
                onClick={() => setFlexInterval(exploitation.recommendedFlex)}
              >
                Preporučeni interval
              </button>
              <button
                style={styles.secondaryBtn}
                onClick={() => {
                  setLaborDiscount(10);
                  setPartsDiscount(12);
                  setOilDiscount(18);
                }}
              >
                Primer rabata
              </button>
            </div>

            <div style={styles.helperBox}>
              <div>1 h = 100 TU</div>
              <div>Preporučena satnica za klasu: {formatRsd(decoded.hourlyRate || hourlyRate)}</div>
              <div>
                Cena 1 TU posle rabata:{" "}
                {formatRsd(((hourlyRate || 0) / 100) * (1 - laborDiscount / 100))}
              </div>
              <div>Količina ulja: {decoded.oilCapacity ? `${decoded.oilCapacity} L` : "-"}</div>
              <div>Godišnja kilometraža: {formatNum(annualKm, 0)} km</div>
              <div>Model habanja kočnica: {exploitation.label}</div>
            </div>
          </div>

          <div>
            <div style={styles.contentCard}>
              <div style={styles.contentHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Vozilo i tehnički profil</h2>
                  <div style={styles.muted}>
                    Dekodirani podaci, engine/fluid logika, menjač i aktivna varijanta.
                  </div>
                </div>

                <div style={styles.headerBadgeWrap}>
                  <span style={styles.darkBadge}>
                    VIN {decoded.supported ? "prepoznat" : "nije podržan"} ({decoded.confidence || "-"})
                  </span>
                  <span style={styles.lightBadge}>{sessionUser.company}</span>
                </div>
              </div>

              {!decoded.supported ? (
                <div style={{ color: "#b91c1c", fontWeight: 700, marginTop: 12 }}>{decoded.reason}</div>
              ) : (
                <>
                  <div style={styles.infoGrid}>
                    <InfoCard label="Marka / model" value={`${decoded.marka} ${decoded.model}`} />
                    <InfoCard label="Motor" value={`${decoded.motorKod} / ${decoded.motor}`} />
                    <InfoCard label="Menjač / godina" value={`${decoded.menjac} / ${decoded.modelYear}`} />
                    <InfoCard label="Kategorija satnice" value={formatRsd(decoded.hourlyRate || hourlyRate)} />
                    <InfoCard label="Engine DB status" value="Povezan" />
                    <InfoCard label="Pogon bregaste" value="Zupčasti remen" />
                    <InfoCard label="DPF / SCR" value={decoded.fuelType === "Diesel" ? "DPF / SCR" : "GPF / -"} />
                    <InfoCard
                      label="Svećice / filter goriva"
                      value={decoded.fuelType === "Diesel" ? "0 / da" : "4 / ne"}
                    />
                    <InfoCard label="Fluid DB status" value="Povezan" />
                    <InfoCard label="Količina motornog ulja" value={`${decoded.oilCapacity} L`} />
                    <InfoCard label="VW norma ulja" value={decoded.oilSpec} />
                    <InfoCard label="SAE" value={decoded.oilSae} />
                    <InfoCard
                      label="Varijanta"
                      value={`${decoded.motor} / ${decoded.menjac} / ${decoded.drivetrain}`}
                    />
                    <InfoCard label="Tip menjača" value={decoded.menjac} />
                    <InfoCard label="Kod menjača" value={decoded.gearboxCode} />
                    <InfoCard label="Ulje menjača" value={decoded.menjac.includes("DSG") ? "6 L" : "N/A"} />
                  </div>
                </>
              )}
            </div>

            <div style={styles.statsGrid}>
              <StatCard title="Ukupno održavanje" value={formatRsd(totalSale)} />
              <StatCard title="Servisi" value={formatRsd(totalService)} />
              <StatCard title="Kočnice" value={formatRsd(totalBrakes)} />
              <StatCard title="Trošak po km" value={formatRsd(costPerKm)} />
              <StatCard title="Trošak po mesecu" value={formatRsd(costPerMonth)} />
              <StatCard title="Ukupni događaji" value="11" />
            </div>

            <div style={styles.contentCard}>
              <h2 style={styles.sectionTitle}>TCO scenario analysis</h2>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Scenario</th>
                      <th style={styles.thRight}>Flex interval</th>
                      <th style={styles.thRight}>Brake faktor</th>
                      <th style={styles.thRight}>Ukupno</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarioRows.map((row) => (
                      <tr key={row.label}>
                        <td style={styles.td}>{row.label}</td>
                        <td style={styles.tdRight}>{formatNum(row.flex, 0)} km</td>
                        <td style={styles.tdRight}>{row.brakeFactor}</td>
                        <td style={styles.tdRight}>{formatRsd(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #f1f5f9, #ffffff, #f1f5f9)",
    padding: 24,
    color: "#0f172a",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: 1500,
    margin: "0 auto",
  },
  hero: {
    background: "#020617",
    color: "#fff",
    borderRadius: 28,
    padding: 28,
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "center",
    marginBottom: 24,
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
  },
  heroBadge: {
    fontSize: 14,
    color: "#cbd5e1",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 48,
    margin: 0,
    lineHeight: 1.05,
  },
  heroSubtitle: {
    marginTop: 12,
    color: "#cbd5e1",
    fontSize: 18,
  },
  heroMetaWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(160px, 1fr))",
    gap: 12,
    minWidth: 520,
  },
  heroMetaCard: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    padding: 18,
    borderRadius: 20,
  },
  heroMetaLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 8,
  },
  heroMetaValue: {
    fontSize: 18,
    fontWeight: 700,
  },
  logoutBtn: {
    background: "#fff",
    color: "#0f172a",
    border: "none",
    borderRadius: 20,
    padding: "18px 20px",
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "460px 1fr",
    gap: 24,
    alignItems: "start",
  },
  sidebarCard: {
    background: "#fff",
    borderRadius: 28,
    padding: 28,
    boxShadow: "0 1px 10px rgba(0,0,0,0.08)",
  },
  contentCard: {
    background: "#fff",
    borderRadius: 28,
    padding: 28,
    boxShadow: "0 1px 10px rgba(0,0,0,0.08)",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    margin: "0 0 16px",
  },
  muted: {
    color: "#64748b",
    fontSize: 16,
  },
  label: {
    display: "block",
    marginBottom: 8,
    marginTop: 12,
    fontWeight: 700,
    color: "#334155",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    fontSize: 18,
    outline: "none",
    marginBottom: 2,
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  threeCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
  },
  buttonRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 16,
  },
  secondaryBtn: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    padding: "12px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 700,
  },
  helperBox: {
    marginTop: 20,
    paddingTop: 16,
    borderTop: "1px solid #e2e8f0",
    display: "grid",
    gap: 8,
    color: "#334155",
    fontSize: 16,
  },
  contentHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "start",
    marginBottom: 18,
  },
  headerBadgeWrap: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  darkBadge: {
    background: "#0f172a",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 14,
  },
  lightBadge: {
    border: "1px solid #cbd5e1",
    padding: "8px 12px",
    borderRadius: 12,
    fontSize: 14,
    color: "#334155",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
    gap: 14,
  },
  infoCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 18,
    background: "#fff",
  },
  infoLabel: {
    color: "#64748b",
    fontSize: 15,
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.3,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: 14,
    marginBottom: 20,
  },
  statCard: {
    background: "#fff",
    borderRadius: 22,
    padding: 20,
    boxShadow: "0 1px 10px rgba(0,0,0,0.08)",
  },
  statLabel: {
    color: "#64748b",
    fontSize: 15,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 800,
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px 10px",
    borderBottom: "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: 14,
  },
  thRight: {
    textAlign: "right",
    padding: "12px 10px",
    borderBottom: "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: 14,
  },
  td: {
    padding: "14px 10px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 16,
  },
  tdRight: {
    padding: "14px 10px",
    borderBottom: "1px solid #f1f5f9",
    textAlign: "right",
    fontSize: 16,
  },
};
