import { useEffect, FC } from 'react';
import {
  definePlugin,
  staticClasses,
} from "decky-frontend-lib";
import { FaShip } from "react-icons/fa";

const Content: FC = () => {
  useEffect(() => {
    fetch('https://serverAddress.com/api/v1/verse?book=John&chapter=3&verses=16&version=NLT')
      .then(response => response.json())
      .then(data => {
        new Notification('Bible Verse', { body: data.verse });
      });
  }, []);

  return null; // Return null if you don't want to render anything
};

export default definePlugin(() => {
  return {
    title: <div className={staticClasses.Title}>Example Plugin</div>,
    content: <Content />,
    icon: <FaShip />,
  };
});