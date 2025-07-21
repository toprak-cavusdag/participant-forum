
import { Popconfirm, Button } from "antd";
import { FaTrash } from "react-icons/fa";

const PopConfirmDelete = ({ onConfirm, title = "Silmek istediğinize emin misiniz?" }) => {
  return (
    <Popconfirm
      title={title}
      onConfirm={onConfirm}
      okText="Evet"
      cancelText="Hayır"
      okButtonProps={{ danger: true }}
    >
      <Button danger type="text" icon={<FaTrash />} />
    </Popconfirm>
  );
};

export default PopConfirmDelete;
