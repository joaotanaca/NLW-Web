import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { Link, useHistory } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { Map, TileLayer, Marker } from "react-leaflet";

import logo from "../../assets/logo.svg";
import "./styles.css";
import api from "../../services/api";
import axios from "axios";
import { LeafletMouseEvent } from "leaflet";

interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface IBGEUFResponse {
  sigla: string;
}

interface IBGECityResponse {
  nome: string;
}

const CreatePoint: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [ufs, setUfs] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [initialPosition, setInitialPosition] = useState<[number, number]>([
    0,
    0,
  ]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
  });

  const [selectedUf, setSelectedUf] = useState("0");
  const [selectedCity, setSelectedCity] = useState("0");
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([
    0,
    0,
  ]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const history = useHistory();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      setInitialPosition([latitude, longitude]);
    });
  }, []);

  useEffect(() => {
    api.get("/items").then(({ data }) => {
      setItems(data);
    });
  }, []);

  useEffect(() => {
    axios
      .get<IBGEUFResponse[]>(
        "https://servicodados.ibge.gov.br/api/v1/localidades/estados"
      )
      .then(({ data }) => {
        const ufInitials = data.map(({ sigla }) => sigla);
        setUfs(ufInitials);
      });
  }, []);

  useEffect(() => {
    axios
      .get<IBGECityResponse[]>(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`
      )
      .then(({ data }) => {
        const cityNames = data.map(({ nome }) => nome);
        setCities(cityNames);
      });
  }, [selectedUf]);

  function handleSelectedUf(e: ChangeEvent<HTMLSelectElement>) {
    const uf = e.target.value;
    setSelectedUf(uf);
  }

  function handleSelectedCity(e: ChangeEvent<HTMLSelectElement>) {
    const city = e.target.value;
    setSelectedCity(city);
  }

  function handleMapMarker(e: LeafletMouseEvent) {
    setSelectedPosition([e.latlng.lat, e.latlng.lng]);
  }

  function handleInputChange({
    target: { name, value },
  }: ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [name]: value,
    });
  }
  function handleSelectedItem(id: number) {
    const alreadySelect = selectedItems.findIndex((item) => item === id);
    if (alreadySelect >= 0) {
      const filteredItems = selectedItems.filter((item) => item !== id);
      setSelectedItems(filteredItems);
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  }
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const { email, name, whatsapp } = formData;
    const uf = selectedUf;
    const city = selectedCity;
    const [latitude, longitude] = selectedPosition;
    const items = selectedItems;
    const data = {
      name,
      email,
      whatsapp,
      uf,
      city,
      latitude,
      longitude,
      items,
    };

    await api.post("/points", data);

    history.push("/");
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta" />

        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>
      <form onSubmit={handleSubmit}>
        <h1>Cadastro do ponto de coleta</h1>

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input
              type={"text"}
              name={"name"}
              id={"name"}
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                type={"text"}
                name={"email"}
                id={"email"}
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input
                type={"text"}
                name={"whatsapp"}
                id={"whatsapp"}
                value={formData.whatsapp}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map center={initialPosition} zoom={15} onCLick={handleMapMarker}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={selectedPosition} />
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado(UF)</label>
              <select
                name={"uf"}
                id={"uf"}
                value={selectedUf}
                onChange={handleSelectedUf}
              >
                <option value="0">Selecione uma uf</option>
                {ufs.map((uf, index) => (
                  <option key={index} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="cidade">Cidade</label>
              <select
                name={"cidade"}
                id={"cidade"}
                value={selectedCity}
                onChange={handleSelectedCity}
              >
                <option value="0">Selecione uma cidade</option>
                {cities.map((city, index) => (
                  <option key={index} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <h2>Items de coleta</h2>
            <span>Selecione um ou mais items abaixo</span>
          </legend>

          <ul className={"items-grid"}>
            {items.map(({ title, image_url, id }) => (
              <li
                key={id}
                onClick={() => handleSelectedItem(id)}
                className={selectedItems.includes(id) ? "selected" : ""}
              >
                <img src={image_url} alt={`${title}`} />
                <span>{title}</span>
              </li>
            ))}
          </ul>
        </fieldset>
        <button type={"submit"}>Cadastrar ponto de coleta</button>
      </form>
    </div>
  );
};

export default CreatePoint;
