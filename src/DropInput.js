const DropInput = (props) => {

  let type = "";
  let className = "drop-me background-people";
  let itemListId = "itemList-person"
  if (props.type === "person") type = "osoba,osoby";
  if (props.type === "condition") {
    type = "warunek";
    itemListId = "itemList-condition"
    className = "drop-me background-condition";
  }
  if (props.type === "delete") {
    type = "Usuń";
    className = "delete-me background-delete";
  }

  return (
    <>
      <input
        id={props.id}
        className={className}
        draggable="true"
        readOnly
        onDragStart={(event) => (
          event.dataTransfer.setData("id", event.target.id),
          (event.currentTarget.style.backgroundColor = "white")
        )}
        autoComplete="off"
      />
    </>
  );
};

export default DropInput;
