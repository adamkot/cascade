import React, { useState, useEffect, useRef } from "react";
import DropInput from "./DropInput";
import useToken from "./useToken";
import Notification from "./Notification";

const Cascada = ({ existCascada, nameOfCascada, parentCallback }) => {
  const { token } = useToken();
  const [notification, setNotification] = useState({});
  const dropzoneRef = useRef(null);
  const dropAnimRef = useRef(null);
  const dropRef = useRef(null);
  const [cascadeName, setCascadeName] = useState();

  const cascadaSubmit = (cascadeText) => {
    sendCascada({
      cascadeName,
      cascadeText,
    });
    //ustawiam timeout na 2500 aby zdążyły schować się notyfikacje
    setTimeout(() => {
      const dropAnim = dropAnimRef.current;
      const drop = dropRef.current;
      dropAnim.className = 'drop-anim-hide';
      drop.className = 'drop-hide';
      setTimeout(() => {
        parentCallback({name:cascadeName, value:cascadeText});
      }, 900);
    }, 2500);
  };

  function sendCascada(credentials) {
    return fetch("http://localhost:8080/auth/cascade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })
      .then((data) => {
        if (!data.ok) {
          throw Error("Niepowodzenie w wysyłaniu danych");
        } else {
          data.json();
          setNotification({
            text: "Poprawnie zapisano kaskadę",
            type: "success",
            time: 2000,
            val: Math.random(),
          });
        }
      })
      .catch((error) => {
        setNotification({
          text: error.message,
          type: "alert",
          time: 2000,
          val: Math.random(),
        });
      });
  }

  /*
  Funkcja ładująca kaskade z zapisanych danych obudowana w useEffect aby
  odczekać aż dropzone zostanie wygenerowany
  */
  useEffect(() => {
    //pobieram node element dropzone
    const dropzoneNode = dropzoneRef.current;
    //czyszcze diva z poprzedniej kaskady
    dropzoneNode.innerHTML = "";
    if (existCascada !== undefined && dropzoneRef) {
      setCascadeName(nameOfCascada);
      const cascadaTable = existCascada.split("|");
      //pierwszy i ostani element tablicy to "start" i "stop" - pomijam
      for (let i = 1; i < cascadaTable.length - 1; i++) {
        //sprawdzam czy to warunek za pomocą funkcji createCondition
        //jeśli nie, to dodaje zwykłego inputa
        const condition = createCondition(cascadaTable, i, dropzoneNode);
        if (condition.isCondition) {
          i = condition.index;
        } else {
          dropzoneNode.appendChild(
            createInputSimple(cascadaTable[i], "person")
          );
        }
      }
    }
  }, [existCascada, dropzoneRef]);

  function createCondition(cascadaTable, i, dropzoneNode) {
    if (cascadaTable[i] === "[") {
      //to jest to warunek
      //deklaruje pierwszą zmienną right. Określa pole do którego będą dodawane kolejne inputy (lewe lub prawe). Zmieni się po wykryciu znaku zmiany ":"
      let right = false;
      //przechodzę do kolejnego elementu po '['
      i++;
      //kolejnym elementem na pewno jest opis warunku
      //dodaje go jako input "condition"
      const inputDivContainer = createInputSimple(cascadaTable[i], "condition");
      const divs = createInputCondition(inputDivContainer, i);
      dropzoneNode.appendChild(divs.inputDiv);
      //kolejnym elementem jest znak zapytania '?'
      i++;
      //sprawdzam, jeśli nie to wychodzę z funkcji
      if (cascadaTable[i] !== "?") return { isCondition: false, index: i };
      //następnym elementem jest lewa odnoga warunku
      i++;
      //tu może wystapić zwykły input lub kolejny warunek
      //zaczynam od wywołania pętli
      //pętla wykonuje się aż do wykrycia znaku końca warunku "]"
      while (cascadaTable[i] !== "]") {
        //jeśli znajdę ":" usuwam go z pola i zmieniam stronę na prawą
        if (cascadaTable[i] === ":") {
          //zmieniam stronę (zmienna right) i przechodzę do kolejnego elementu
          right = true;
          i++;
          //sprawdzam czy to nie warunek
          if (cascadaTable[i] === "[") {
            const condition = createCondition(cascadaTable, i, divs.rightDiv);
            i = condition.index;
          } else {
            //jeśli nie to dodaje zwykłego inputa
            divs.rightDiv.appendChild(
              createInputSimple(cascadaTable[i], "person")
            );
          }
        }
        //w przypadku wykrycia znaku "[" oznacza to rozpoczęcie warunku w warunku = rekurencja tej funkcji
        else if (cascadaTable[i] === "[") {
          //w zależności czy warunek jest z lewej czy z prawej dodaje nowy warunek odpowiednio
          const condition = right
            ? createCondition(cascadaTable, i, divs.rightDiv)
            : createCondition(cascadaTable, i, divs.leftDiv);
          //do końcowego indexu należy dodać jeden aby uniknąć złapania znaku "]"
          i = condition.index;
        }
        //jeśli nic z powyższych nie zostało spełnione dodaje zwykłego inputa
        else {
          if (right) {
            divs.rightDiv.appendChild(
              createInputSimple(cascadaTable[i], "person")
            );
          } else {
            divs.leftDiv.appendChild(
              createInputSimple(cascadaTable[i], "person")
            );
          }
        }
        i++;
      }
      return { isCondition: true, index: i };
    } else {
      return { isCondition: false, index: i };
    }
  }

  function createInputSimple(value, type) {
    let id = type + "-1";
    //ustalam id dla input
    //na początek pobieram głównego inputa (od upuszczania)
    //wyszukuje go po clasie a następnie po id
    const dropMeArray = document.getElementsByClassName("drop-me");
    let dropMe;
    Array.from(dropMeArray).forEach((dm) => {
      if (dm.id.includes(type)) dropMe = dm;
    });
    //jeśli istnieje to pobieram jego id a następnie aktualizuje mu jego id
    if (dropMe !== undefined) {
      id = dropMe.id;
      let changeId = dropMe.id.split("-");
      changeId[1]++;
      dropMe.id = changeId[0] + "-" + changeId[1];
    }
    const inputDiv = document.createElement("div");
    //ustawiam inputa
    const copyElement = document.createElement("input");
    copyElement.id = id;
    copyElement.className = "i1 drop-input";
    //ustawiam listenera na getUsers (funkcja podaje podpowiedzi pobrane z backend)
    copyElement.addEventListener("keyup", (event) => {
      getUsers(copyElement.value, copyElement.id);
    });
    //ustawiam wyświetlanie listy pod inputem
    copyElement.setAttribute("list", copyElement.id + "-list");
    copyElement.style.backgroundColor = "white";
    copyElement.value = value;
    inputDiv.className = "drop-div";
    inputDiv.appendChild(copyElement);
    //domyślna lista. Przy utworzeniu inputa od razu ustalam listę podpowiedzi
    createList(id);
    return inputDiv;
  }

  function createInputCondition(inputDivContainer, index) {
    //w przypadku warunku tworze kontener zawierający dwa pola - lewe i prawe
    //pola lewe i prawe mają możliwość przyjmowania (upuszczania) kolejnych elementów
    const container = document.createElement("div");
    const left = document.createElement("div");
    const right = document.createElement("div");
    container.className = "dropzone-container";
    left.className = "dropzone-left";
    right.className = "dropzone-right";
    left.id = "dropzone-left-" + index;
    right.id = "dropzone-right-" + index;
    container.appendChild(left);
    container.appendChild(right);
    inputDivContainer.appendChild(container);
    return { inputDiv: inputDivContainer, leftDiv: left, rightDiv: right };
  }

  /*
  W przypadku gdy do input zostanie dodany "," ponownie wysyłam zapytanie
  o listę uzytkowników uzupełnioną o poprzednich wybranych uzytkowników
  Docelowo otrzymuje liste [imie nazwisko], [imie nazwisko], ...
  */
  function getUsers(value, id) {
    if (!id.includes("condition")) {
      if (value.charAt(value.length - 1) === ",") {
        const input = document.getElementById(id);
        const datalist = document.getElementById(id + "-list");
        fetch(`http://localhost:8080/auth/financial/users/${value}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }).then(async (res) => {
          const data = await res.json();
          if (res.ok) {
            datalist.innerHTML = "";
            data.forEach((il) => {
              let opt = document.createElement("option");
              opt.value = il;
              datalist.appendChild(opt);
            });
            input.value += " ";
          }
        });
      }
    }
  }

  /*
  Pobieram liste users za pomocą fetch.
  W przypadku gdy id zawiera słowo "condition" zamiast listy użytkowników pobieram
  listę możliwych warunków
  */
  function createList(id) {
    const url = id.includes("condition")
      ? `http://localhost:8080/auth/financial/condition`
      : `http://localhost:8080/auth/financial/users`;
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then(async (res) => {
      const data = await res.json();
      if (res.ok) {
        const datalist = document.createElement("datalist");
        datalist.id = id + "-list";
        data.forEach((il) => {
          let opt = document.createElement("option");
          opt.value = il;
          datalist.appendChild(opt);
        });
        document.body.appendChild(datalist);
      }
    });
  }

  function conditionSave(value, inputs, i) {
    let errors = false;
    if (inputs[i].value.length < 5) {
      //valid #3
      setNotification({
        text: "Wszystkie pola muszą być wypełnione",
        type: "alert",
        time: 2000,
        val: Math.random(),
      });
      errors = true;
    }
    value += "|[|" + inputs[i].value + "|?";
    i++;
    if (inputs[i]) {
      //valid #4
      let parentId = inputs[i].parentElement.parentElement.id;
      //lewa
      for (; parentId === inputs[i].parentElement.parentElement.id; ) {
        if (inputs[i].id.includes("condition")) {
          const ret = conditionSave(value, inputs, i);
          value = ret.val;
          i = ret.index;
        } else {
          if (inputs[i].value.length < 5) {
            //valid #5
            setNotification({
              text: "Wszystkie pola muszą być wypełnione",
              type: "alert",
              time: 2000,
              val: Math.random(),
            });
            errors = true;
          }
          value += "|" + inputs[i].value;
          parentId = inputs[i].parentElement.parentElement.id;
          i++;
          if (!inputs[i]) {
            //valid #6
            setNotification({
              text: "Ścieżki w warunku nie są kompletne!",
              type: "alert",
              time: 2000,
              val: Math.random(),
            });
            errors = true;
            i--;
            break;
          }
        }
      }
      value += "|:";
      //prawa
      parentId = inputs[i].parentElement.parentElement.id;
      for (; parentId === inputs[i].parentElement.parentElement.id; ) {
        if (inputs[i].id.includes("condition")) {
          const ret = conditionSave(value, inputs, i);
          value = ret.val;
          i = ret.index - 1;
        } else {
          if (inputs[i].value.length < 5) {
            //valid #7
            setNotification({
              text: "Wszystkie pola muszą być wypełnione",
              type: "alert",
              time: 2000,
              val: Math.random(),
            });
            errors = true;
          }
          value += "|" + inputs[i].value;
          parentId = inputs[i].parentElement.parentElement.id;
        }
        if (++i >= inputs.length) break;
      }
      value += "|]";

      return { val: value, index: i, error: errors };
    } else {
      //valid #8
      setNotification({
        text: "Ścieżki w warunku nie są kompletne!",
        type: "alert",
        time: 2000,
        val: Math.random(),
      });
      errors = true;
      return { val: "error", index: i, error: errors };
    }
  }

  return (
    <div ref={dropAnimRef} className="drop-anim">
      <div ref={dropRef} className="drop" >
        <Notification
          name={Cascada.name}
          text={notification.text}
          type={notification.type}
          time={notification.time}
          val={notification.val}
        />
        <DropInput id="person-1" type="person" />
        <DropInput id="condition-1" type="condition" />
        <DropInput id="delete-1" type="delete" />
        <input
          className="i1"
          type="text"
          name="name"
          id="cascadaName"
          placeholder="Nazwa kaskady"
          value={cascadeName}
          onChange={(e) => setCascadeName(e.target.value)}
        />
        <input className="i1 drop-input" value="START" readOnly />
        <div
          ref={dropzoneRef}
          className="dropzone"
          id="dropzone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            const id = event.dataTransfer.getData("id");
            //element upuszczany, zmienie mu id (nadam wyższy numer)
            const draggableElement = document.getElementById(id);
            //copyElement to nowy input będący klonem draggableElementu
            //w dalszej części ustale wszystkie jego parametry
            const copyElement = draggableElement.cloneNode(true);
            //dropzone - miejsce gdzie upuszczam obiekt
            const dropzone = event.target;
            const parent = dropzone.parentElement;
            //element opakowujący copyElement
            //to on będzie miał nadaną klasę drop-div
            //dzięki krórej będzie możliwe usuwanie
            const inputDiv = document.createElement("div");
            let changeId = id.split("-");
            //changeId to tablica gdzie [0] to nazwa pola, a [1] to numer pola
            //jeśli delete to usuwam rodzica o ile jest nim drop-div
            if (changeId[0] === "delete") {
              if (parent.className === "drop-div") parent.remove();
              else return;
            }
            // jeśli żadne z pól nie jest polem przeznaczonym na drop to wyjdź
            if (
              dropzone.className !== "dropzone" &&
              dropzone.className !== "dropzone-left" &&
              dropzone.className !== "dropzone-right"
            )
              return;

            changeId[1]++;
            draggableElement.id = changeId[0] + "-" + changeId[1];
            //ustawiam inputa
            //wyłączam drag and drop
            copyElement.draggable = false;
            copyElement.className = "i1 drop-input";
            //ustawiam listenera na getUsers (funkcja podaje podpowiedzi pobrane z backend)
            copyElement.addEventListener("keyup", (event) => {
              getUsers(copyElement.value, copyElement.id);
            });
            //ustawiam wyświetlanie listy pod inputem
            copyElement.setAttribute("list", copyElement.id + "-list");
            //usuwam atrybut readonly
            copyElement.removeAttribute("readonly");
            inputDiv.className = "drop-div";
            inputDiv.appendChild(copyElement);
            //domyślna lista. Przy utworzeniu inputa od razu ustalam listę podpowiedzi
            createList(id);
            if (changeId[0] === "condition") {
              //w przypadku warunku tworze kontener zawierający dwa pola - lewe i prawe
              //pola lewe i prawe mają możliwość przyjmowania (upuszczania) kolejnych elementów
              const container = document.createElement("div");
              const left = document.createElement("div");
              const right = document.createElement("div");
              container.className = "dropzone-container";
              left.className = "dropzone-left";
              right.className = "dropzone-right";
              left.id = "dropzone-left-" + changeId[1];
              right.id = "dropzone-right-" + changeId[1];
              container.appendChild(left);
              container.appendChild(right);
              inputDiv.appendChild(container);
            }
            dropzone.appendChild(inputDiv);
          }}
        ></div>
        <input className="i1 drop-input" value="STOP" readOnly />
        <button
          className="btn-mid"
          type="button"
          onClick={() => {
            //zmienna, która będzie przetrzymywać informacje o błędach
            let errors = false;
            //na początek nazwa
            const name = document.getElementById("cascadaName");
            const value = name.value;
            //sprawdzam czy nazwa jest poprawna
            if (value.length < 4 || value.length > 240) {
              setNotification({
                text: "Nazwa musi być dłuższa nić 4 znaki i krótsza niż 240 znaków",
                type: "alert",
                time: 3000,
                val: Math.random(),
              });
              errors = true;
            } else {
              //teraz kaskada
              let value = "START";
              const inputs = document
                .getElementById("dropzone")
                .getElementsByTagName("input");
              if (inputs.length < 3) {
                //valid #1
                setNotification({
                  text: "Za krótka kaskada!",
                  type: "alert",
                  time: 2000,
                  val: Math.random(),
                });
                errors = true;
              } else {
                for (let i = 0; i < inputs.length; i++) {
                  if (inputs[i].id.includes("condition")) {
                    const ret = conditionSave(value, inputs, i);
                    value = ret.val;
                    i = ret.index - 1;
                    errors = ret.errors;
                  } else {
                    if (inputs[i].value.length < 5) {
                      //valid #2
                      setNotification({
                        text: "Wszystkie pola muszą być wypełnione!",
                        type: "alert",
                        time: 2000,
                        val: Math.random(),
                      });
                      errors = true;
                    }
                    value += "|" + inputs[i].value;
                  }
                }
                value += "|STOP";
                if (!errors) {
                  cascadaSubmit(value);
                }
              }
            }
          }}
        >
          Zapisz
        </button>
      </div>
    </div>
  );
};

export default Cascada;

