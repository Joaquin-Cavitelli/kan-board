import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Plus, Trash } from "lucide-react";
import "./index.css";

export const App = () => {
  return (
    <div className=" w-full  bg-neutral-50">
      <Board />
    </div>
  );
};

const Board = () => {
  const [cards, setCards] = useState(() => {
    const savedCards = localStorage.getItem("cards");
    return savedCards ? JSON.parse(savedCards) : [];
  });

  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    localStorage.setItem("cards", JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === " " && !modalData) {
        e.preventDefault();
        setModalData({ column: "backlog" }); // Puedes cambiar la columna si es necesario
      }

      if (e.key === "Escape" && modalData) {
        setModalData(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [modalData]);

  return (
    <>
      {/* <div className="p-8 bg-white text-gray-800">
        <div className="grid grid-cols-12 gap-4">
          <div className="flex flex-col items-center justify-center col-span-2 bg-neutral-800 p-4 rounded-lg text-neutral-50 gap-2">
            <p className="text-4xl font-bold text-neutral-400">
              ${calculateColumnPrice("backlog")}
            </p>
            <p className="text-sm mb-2">Backlog:</p>
          </div>

          <div className="flex flex-col items-center justify-center col-span-2 bg-neutral-800 p-4 rounded-lg text-neutral-50 gap-2">
            <p className="text-4xl font-bold text-neutral-400">
              ${calculateColumnPrice("todo")}
            </p>
            <p className="text-sm mb-2">TODO:</p>
          </div>

          <div className="flex flex-col items-center justify-center col-span-2 bg-neutral-800 p-4 rounded-lg text-neutral-50 gap-2">
            <p className="text-4xl font-bold text-neutral-400">
              ${calculateColumnPrice("doing")}
            </p>
            <p className="text-sm mb-2">In Progress:</p>
          </div>

          <div className="flex flex-col items-center justify-center col-span-2 bg-neutral-800 p-4 rounded-lg text-neutral-50 gap-2">
            <p className="text-4xl font-bold text-neutral-400">
              ${calculateColumnPrice("done")}
            </p>
            <p className="text-sm mb-2">Complete:</p>
          </div>

          <div className="flex flex-col items-center justify-center col-span-2 bg-neutral-800 p-4 rounded-lg text-neutral-50 gap-2">
            <p className="text-4xl font-bold text-neutral-400">
              ${calculateColumnPrice("rejected")}
            </p>
            <p className="text-sm mb-2">Rejected:</p>
          </div>
        </div>
      </div> */}

      <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-6  w-full gap-4 p-12 ">
        <Column
          title="Mensajes"
          column="backlog"
          headingColor="bg-gray-600"
          cards={cards}
          setCards={setCards}
          setModalData={setModalData}
        />
        <Column
          title="Tareas"
          column="todo"
          headingColor="bg-[#ed6c02]"
          cards={cards}
          setCards={setCards}
          setModalData={setModalData}
        />
        <Column
          title="Comisiones"
          column="doing"
          headingColor="bg-[#006db3]"
          cards={cards}
          setCards={setCards}
          setModalData={setModalData}
        />
        <Column
          title="Envios"
          column="done"
          headingColor="bg-[#2e7d32]"
          cards={cards}
          setCards={setCards}
          setModalData={setModalData}
        />
        <Column
          title="Sin Comisiones"
          column="rejected"
          headingColor="bg-[#d32f2f]"
          cards={cards}
          setCards={setCards}
          setModalData={setModalData}
        />
        <BurnBarrel setCards={setCards} />
      </div>
      {modalData && (
        <CardModal
          modalData={modalData}
          setModalData={setModalData}
          setCards={setCards}
        />
      )}
    </>
  );
};

const Column = ({
  title,
  headingColor,
  cards,
  column,
  setCards,
  setModalData,
}) => {
  const [active, setActive] = useState(false);

  const handleDragStart = (e, card) => {
    e.dataTransfer.setData("cardId", card.id);
  };

  const handleDragEnd = (e) => {
    const cardId = e.dataTransfer.getData("cardId");

    setActive(false);
    clearHighlights();

    const indicators = getIndicators();
    const { element } = getNearestIndicator(e, indicators);

    const before = element.dataset.before || "-1";

    if (before !== cardId) {
      let copy = [...cards];

      let cardToTransfer = copy.find((c) => c.id === cardId);
      if (!cardToTransfer) return;
      cardToTransfer = { ...cardToTransfer, column };

      copy = copy.filter((c) => c.id !== cardId);

      const moveToBack = before === "-1";

      if (moveToBack) {
        copy.push(cardToTransfer);
      } else {
        const insertAtIndex = copy.findIndex((el) => el.id === before);
        if (insertAtIndex === undefined) return;

        copy.splice(insertAtIndex, 0, cardToTransfer);
      }

      setCards(copy);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    highlightIndicator(e);

    setActive(true);
  };

  const clearHighlights = (els) => {
    const indicators = els || getIndicators();

    indicators.forEach((i) => {
      i.style.opacity = "0";
    });
  };

  const highlightIndicator = (e) => {
    const indicators = getIndicators();

    clearHighlights(indicators);

    const el = getNearestIndicator(e, indicators);

    el.element.style.opacity = "1";
  };

  const getNearestIndicator = (e, indicators) => {
    const DISTANCE_OFFSET = 50;

    const el = indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();

        const offset = e.clientY - (box.top + DISTANCE_OFFSET);

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      }
    );

    return el;
  };

  const getIndicators = () => {
    return Array.from(document.querySelectorAll(`[data-column="${column}"]`));
  };

  const handleDragLeave = () => {
    clearHighlights();
    setActive(false);
  };

  const filteredCards = cards.filter((c) => c.column === column);

  const calculateColumnPrice = (column) => {
    const sum = cards
      .filter((card) => card.column === column && card.price)
      .reduce((sum, card) => sum + parseFloat(card.price || 0), 0);
    
    return parseFloat(sum.toFixed(2)); 
  };
  


  return (
    <div className="shrink-0">
      <div className={`mb-3 text-white  rounded-md ${headingColor} p-4`}>
        <div className="flex items-center justify-between ">
          <h3 className={`font-medium text-sm`}>{title}</h3>
          <span className="">{filteredCards.length}</span>
        </div>
        <p className="text-2xl font-semibold leading-5">
          {calculateColumnPrice(column)}M
        </p>
      </div>
      <div
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`h-full w-full transition-colors ${
          active ? "bg-gray-100" : "bg-neutral-800/0"
        }`}
      >
        <AddCard
          column={column}
          setCards={setCards}
          setModalData={setModalData}
        />
        {filteredCards.map((c) => {
          return (
            <Card
              key={c.id}
              {...c}
              handleDragStart={handleDragStart}
              setModalData={setModalData}
              headingColor={headingColor}
            />
          );
        })}
      </div>
      <DropIndicator
        beforeId={null}
        column={column}
        headingColor={headingColor}
      />
    </div>
  );
};

const Card = ({
  title,
  description,
  price,
  deadline,
  id,
  column,
  handleDragStart,
  setModalData,
  headingColor,
}) => {
  const today = new Date().toISOString().split("T")[0];
  const isToday = deadline === today;
  const isPast = deadline && deadline < today;


  const formatDate = (dateString) => {
    if (!dateString) return "";
    const localDateString = dateString + "T00:00:00";
    const options = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return new Date(localDateString).toLocaleDateString("es-ES", options);
  };

  return (
    <>
      <DropIndicator
        beforeId={id}
        column={column}
        headingColor={headingColor}
      />
      <motion.div
        layout
        layoutId={id}
        draggable="true"
        onDragStart={(e) =>
          handleDragStart(e, {
            title,
            description,
            price,
            deadline,
            id,
            column,
          })
        }
        onDoubleClick={() =>
          setModalData({ id, title, description, price, deadline, column })
        }
        className={`cursor-grab rounded border overflow-hidden bg-white p-4 active:cursor-grabbing relative`}
      >
        <div
          className={`w-1 h-full ${headingColor} absolute top-0 left-0`}
        ></div>
        <div className="flex items-center justify-between flex-wrap ">
          <p className=" text-sm text-gray-600 font-bold capitalize mr-3">
            {title}
          </p>
          {price && (
            <p className="text-xs text-gray-500">{price}M</p>
          )}
        </div>
        {description && (
          <p
            className="text-xs text-gray-400 leading-3 my-1 "
            style={{ whiteSpace: "pre-wrap" }}
          >
            {description}
          </p>
        )}
        {deadline &&
          (isToday ? (
            <p className="text-[10px] leading-3 justify-self-end  text-yellow-600">{`${formatDate(
              deadline
            )}`}</p>
          ) : isPast ? (
            <p className="text-[10px] leading-3 justify-self-end  text-red-600">{`${formatDate(deadline)}`}</p>
          ) : (
            <p className="text-[10px] leading-3 justify-self-end  text-gray-400">{`${formatDate(deadline)}`}</p>
          ))}
      </motion.div>
    </>
  );
};

const DropIndicator = ({ beforeId, column, headingColor }) => {
  return (
    <div
      data-before={beforeId || "-1"}
      data-column={column}
      className={`my-1 h-0.5 w-full ${headingColor} opacity-0`}
    />
  );
};

const BurnBarrel = ({ setCards }) => {
  const [active, setActive] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setActive(true);
  };

  const handleDragLeave = () => {
    setActive(false);
  };

  const handleDragEnd = (e) => {
    const cardId = e.dataTransfer.getData("cardId");

    setCards((pv) => pv.filter((c) => c.id !== cardId));

    setActive(false);
  };

  return (
    <div
      onDrop={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`grid h-16 w-16 md:h-24 md:w-24 shrink-0 place-content-center rounded-xl fixed bottom-10 right-10 transition-colors ${
        active ? " bg-red-500 text-white" : " bg-gray-400 text-white"
      }`}
    >
      <Trash size={50} strokeWidth={1.4} />
    </div>
  );
};

const AddCard = ({ column, setCards, setModalData }) => {
  return (
    <motion.button
      layout
      onClick={() => setModalData({ column })}
      className="flex w-full items-center gap-1.5 px-4 py-2 text-sm text-gray-400 transition-colors hover:text-gray-600"
    >
      <span>Agregar</span>
      <Plus className="size-4" />
    </motion.button>
  );
};

const CardModal = ({ modalData, setModalData, setCards }) => {
  const [title, setTitle] = useState(modalData.title || "");
  const [description, setDescription] = useState(modalData.description || "");
  const [price, setPrice] = useState(modalData.price || "");
  const [deadline, setDeadline] = useState(modalData.deadline || "");

  const modalRef = useRef(null);

  const titleRef = useRef(null); // Referencia para el input del título

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus(); // Enfocar el input cuando se abre el modal
    }
  }, []); // Se ejecuta solo una vez cuando el modal se renderiza

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setModalData(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) return;

    const updatedCard = {
      id: modalData.id || Math.random().toString(),
      column: modalData.column,
      title: title.trim(),
      description: description.trim(),
      price: price.trim(),
      deadline: deadline.trim(),
    };

    setCards((prev) => {
      const filtered = prev.filter((c) => c.id !== updatedCard.id);
      return [...filtered, updatedCard];
    });

    setModalData(null);
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 ">
      <form
        onSubmit={handleSubmit}
        ref={modalRef}
        className="bg-white p-6 rounded-md w-full max-w-3xl shadow-xl text-gray-700 flex flex-col justify-between gap-5 "
      >
        <div className="flex flex-col gap-4">
          <h2 className="text-lg p-2 font-semibold text-gray-800">
            {modalData.id ? "Edit Card" : "Add Card"}
          </h2>

          <input
            type="text"
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full text-sm p-3 rounded border border-gray-300 outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full p-3 text-sm  rounded border border-gray-300 outline-none resize-none h-56"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              value={price}
              step="0.01"
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price"
              className="w-full text-sm  p-3 rounded border border-gray-300 outline-none"
            />
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full text-sm  p-3 rounded border border-gray-300 outline-none "
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 text-sm">
          <button
            type="button"
            onClick={() => setModalData(null)}
            className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded w-44 bg-orange-500 text-white hover:bg-orange-600 transition"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
};
