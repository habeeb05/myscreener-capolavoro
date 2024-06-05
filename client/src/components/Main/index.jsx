import { useState, useEffect, useMemo } from "react";
import styles from "./styles.module.css";
import { jwtDecode } from "jwt-decode";
import Switch from "../Switch/Switch";
import axios from "axios";

const Main = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [value, setValue] = useState(false);
  const [cryptoData, setCryptoData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const handleToggle = () => {
    setValue(!value);

    const url = `http://localhost:3000/${
      value ? "deactivate" : "activate"
    }-websocket`;
    fetch(url)
      .then((response) => {
        if (response.ok) {
          console.log(`WebSocket ${value ? "disattivata" : "attivata"}`);
        } else {
          console.error(
            `Errore durante la ${
              value ? "disattivazione" : "attivazione"
            } della WebSocket`
          );
        }
      })
      .catch((error) => {
        console.error(
          `Errore durante la ${
            value ? "disattivazione" : "attivazione"
          } della WebSocket:`,
          error
        );
      });
  };

  const formatNumber = (number) => {
    if (number >= 1e9) {
      return (number / 1e9).toFixed(1) + "B";
    } else if (number >= 1e6) {
      return (number / 1e6).toFixed(1) + "M";
    } else if (number >= 1e3) {
      return (number / 1e3).toFixed(1) + "K";
    } else {
      return Number(number).toFixed(2);
    }
  };

  const getColorClass = (change) => {
    return change >= 0 ? styles.positive_change : styles.negative_change;
  };

  const getIcon = (change) => {
    return change >= 0 ? "↑" : "↓";
  };

  const requestCryptoData = () => {
    axios
      .get("http://localhost:3000/update-crypto-data")
      .then((response) => {
        const updatedCryptoData = [...cryptoData];
        response.data.forEach((crypto) => {
          const index = updatedCryptoData.findIndex(
            (item) => item.baseToken.symbol === crypto.baseToken.symbol
          );
          if (index !== -1) {
            updatedCryptoData[index] = crypto;
          } else {
            updatedCryptoData.push(crypto);
          }
        });
        setCryptoData(updatedCryptoData);
      })
      .catch((error) => {
        console.error("Error updating crypto data:", error);
      });
  };

  const sortData = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedCryptoData = useMemo(() => {
    let sortableItems = [...cryptoData];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const valueA = parseFloat(a[sortConfig.key]);
        const valueB = parseFloat(b[sortConfig.key]);
        if (valueA < valueB) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (valueA > valueB) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [cryptoData, sortConfig]);

  useEffect(() => {
    const getUserInfoFromToken = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const id = decoded.userId;
          fetch(`http://localhost:3000/signup/${id}`)
            .then((response) => response.json())
            .then((data) => {
              setUserInfo({
                firstname: data.firstName,
                lastname: data.lastName,
                email: data.email,
              });
            })
            .catch((error) => {
              console.error("Error fetching data:", error);
            });
        } catch (error) {
          console.error("Impossibile decodificare il token JWT:", error);
        }
      }
    };

    getUserInfoFromToken();

    const intervalId = setInterval(() => {
      requestCryptoData();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className={styles.main_container}>
      <nav className={styles.navbar}>
        <h1>MyScreener</h1>
        <button className={styles.white_btn} onClick={handleLogout}>
          <p style={{ fontWeight: "bold", fontSize: "12px", color: "black" }}>
            Logout
          </p>
        </button>
      </nav>
      {userInfo && (
        <div className={styles.user_info}>
          <p>{`Benvenuto, ${userInfo.firstname} ${userInfo.lastname}`}</p>
          <p>{`Email: ${userInfo.email}`}</p>
        </div>
      )}
      <div className={styles.toggle_container}>
        <div className={styles.toggle_content}>
          <p style={{ fontWeight: "bold" }}>
            ABILITA CONNESSIONE CON RAYDIUM PER RICERCA DI NUOVE LP
          </p>
          <p>
            (trovare la lp dipende da RAYDIUM, QUICKNODE e DALLA BLOCKCHAIN
            STESSA, QUINDI SE NON SI TROVANO SEMPLICEMENTE NON STANNO VENENDO
            CREATE)
          </p>
        </div>
        <Switch isOn={value} handleToggle={handleToggle} />
      </div>

      {cryptoData.length > 0 ? (
        <div className={styles.crypto_table_container}>
          <h2>Crypto Data</h2>
          <table className={styles.crypto_table}>
            <thead>
              <tr>
                <th onClick={() => sortData("baseToken.name")}>
                  Token
                  {sortConfig.key === "baseToken.name" && (
                    <span>
                      {sortConfig.direction === "ascending" ? "⬆️" : "⬇️"}
                    </span>
                  )}
                </th>
                <th onClick={() => sortData("priceUsd")}>
                  Price (USD)
                  {sortConfig.key === "priceUsd" && (
                    <span>
                      {sortConfig.direction === "ascending" ? "⬆️" : "⬇️"}
                    </span>
                  )}
                </th>
                <th onClick={() => sortData("priceChange.m5")}>
                  Change 5m
                  {sortConfig.key === "priceChange.m5" && (
                    <span>
                      {sortConfig.direction === "ascending" ? "⬆️" : "⬇️"}
                    </span>
                  )}
                </th>
                <th onClick={() => sortData("priceChange.h1")}>
                  Change 1h
                  {sortConfig.key === "priceChange.h1" && (
                    <span>
                      {sortConfig.direction === "ascending" ? "⬆️" : "⬇️"}
                    </span>
                  )}
                </th>
                <th onClick={() => sortData("priceChange.h6")}>
                  Change 6h
                  {sortConfig.key === "priceChange.h6" && (
                    <span>
                      {sortConfig.direction === "ascending" ? "⬆️" : "⬇️"}
                    </span>
                  )}
                </th>
                <th onClick={() => sortData("priceChange.h24")}>
                  Change 24h
                  {sortConfig.key === "priceChange.h24" && (
                    <span>
                      {sortConfig.direction === "ascending" ? "⬆️" : "⬇️"}
                    </span>
                  )}
                </th>
                <th onClick={() => sortData("volume.h24")}>
                  Volume 24h
                  {sortConfig.key === "volume.h24" && (
                    <span>
                      {sortConfig.direction === "ascending" ? "⬆️" : "⬇️"}
                    </span>
                  )}
                </th>
                <th onClick={() => sortData("liquidity.usd")}>
                  Liquidity (USD)
                  {sortConfig.key === "liquidity.usd" && (
                    <span>
                      {sortConfig.direction === "ascending" ? "⬆️" : "⬇️"}
                    </span>
                  )}
                </th>
                <th onClick={() => sortData("fdv")}>
                  FDV
                  {sortConfig.key === "fdv" && (
                    <span>
                      {sortConfig.direction === "ascending" ? "⬆️" : "⬇️"}
                    </span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCryptoData.map((crypto, index) => (
                <tr key={index}>
                  <td>{`${crypto.baseToken.name} (${crypto.baseToken.symbol})`}</td>
                  <td>{Number(crypto.priceUsd).toFixed(8)}</td>
                  <td className={getColorClass(crypto.priceChange.m5)}>
                    {getIcon(crypto.priceChange.m5)} {crypto.priceChange.m5}%
                  </td>
                  <td className={getColorClass(crypto.priceChange.h1)}>
                    {getIcon(crypto.priceChange.h1)} {crypto.priceChange.h1}%
                  </td>
                  <td className={getColorClass(crypto.priceChange.h6)}>
                    {getIcon(crypto.priceChange.h6)} {crypto.priceChange.h6}%
                  </td>
                  <td className={getColorClass(crypto.priceChange.h24)}>
                    {getIcon(crypto.priceChange.h24)} {crypto.priceChange.h24}%
                  </td>
                  <td>{formatNumber(crypto.volume.h24)}</td>
                  <td>{formatNumber(crypto.liquidity.usd)}</td>
                  <td>{formatNumber(crypto.fdv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Loading data...</p>
      )}
    </div>
  );
};

export default Main;
