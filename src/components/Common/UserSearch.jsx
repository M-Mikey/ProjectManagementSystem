import { useEffect, useState } from "react";
import { API_URL } from "../../api/apiConfig";
import "../../styles/UserSearch.css";

export default function UserSearch({ onUserSelect, selectedUser }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);

  // 🔑 Restore value when coming back
  useEffect(() => {
    if (selectedUser) {
      setQuery(`${selectedUser.name} - ${selectedUser.userName}`);
    } else {
      setQuery("");
    }
  }, [selectedUser]);

  const searchUsers = async (value) => {
    setQuery(value);

    if (value.length < 2) {
      setUsers([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/v1/users/search?q=${value}`
      );
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const handleSelect = (user) => {
    setQuery(`${user.name} - ${user.userName}`); // ✅ correct format
    setUsers([]);

    if (onUserSelect) {
      onUserSelect(user);
    }
  };

  return (
    <div className="user-search-wrapper">
      <input
        type="text"
        className="form-control"
        placeholder="Search user..."
        value={query}
        onChange={(e) => searchUsers(e.target.value)}
        autoComplete="off"
      />

      {users.length > 0 && (
        <ul className="user-search-dropdown list-group">
          {users.map((u) => (
            <li
              key={u.userName}
              className="list-group-item list-group-item-action"
              onClick={() => handleSelect(u)}
            >
              {/** 
              <small>{u.name} - {u.userName}</small>*/}
              <small>
                {u.name} [<strong>{u.userName}</strong>]
              </small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
