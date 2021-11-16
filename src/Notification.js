import React, { useEffect } from "react";

/**
 * Aby wywołać notyfikacje należy:
 * 1. W wybranym miejscu wyświetlania w komponencie musi być dodany kod:
 *      <Notification name={NAME_OF_COMPONENT.name} text={notification.text} type={notification.type} time={notification.time} val={notification.val} />
 * 2. W domyslnej funkcji komponentu musi istnieć stała:
        const [notification, setNotification] = useState({});
 * 3. Aby wywołać notyfikacje należy wywyłać:
        setNotification({text:"TEXT BŁĘDU", type:"TYP", time:CZAS, val:Math.random()});
        //TYP: do wyboru: alert/success default: alert
        //TIME: czas wyświetlania komunikatu w ms default: 2000, min 500, max 10000
        //val: dowolna, niepowtarzalna wartość liczbowa
 */

const Notification = ({name, text, type, time, val}) => {

  useEffect(() => {
    if (text !== undefined && text !== null) {
      //przypisywanie wartości domyślnych
      if (type !== "alert" && type !== "success") type = "alert";
      if (time === undefined || time < 500 || time > 10000) time = 2000;

      //do klasy dodaje notify_NAZWA. Dzięki temu mogę rozróżniać kilka notyfikacji w ramach jednego formularza
      document.querySelector(".notify_" + name).classList.add("active");
      document.getElementById(`notifyType_${name}`).className = "active " + type;
      //podwójny timeout do poprawnego wyświetlania chowającego się tekstu
      setTimeout(() => {
        setTimeout(() => {
          document.getElementById(`notifyType_${name}`).className = "";
        }, 120);
        document.querySelector(".notify_" + name).classList.remove("active");
        return null;
      }, time);
    }
  }, [val]);

  return (
    <div className={`notify notify_${name}`} >
      <span id={`notifyType_${name}`} className="">
        {text}
      </span>
    </div>
  );
};

export default Notification;
