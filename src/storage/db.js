import * as firebase from 'firebase/app';

import 'firebase/auth'; // подключение к API firebase
import 'firebase/database'; // добавление плагинов по работе с базой

// конфиг из админке FireBase + нужно в настройках БД разрешить чтение/запись
// https://firebase.google.com/docs/database/security/quickstart?authuser=0
const serviceAccount = {
   apiKey: 'AIzaSyAg-V7r7CYcQ53AyTqOjybAan4wrhMoyFE',
   authDomain: 'workline-71bd0.firebaseapp.com',
   databaseURL: 'https://workline-71bd0.firebaseio.com',
   projectId: 'workline-71bd0',
   storageBucket: 'workline-71bd0.appspot.com',
   messagingSenderId: '38322499442',
   appId: '1:38322499442:web:204d70005f42e4cf2df7eb',
   measurementId: 'G-ESJ4STGKD2',
};

// создаем коннект к БД
firebase.initializeApp(serviceAccount);
const database = firebase.database();

/**
 * Доступ к API FireBase
 * Пример: const api = DataBaseApi();
 */
class DataBaseApi {

   /**
    * Уровень доступа к данным обучения, по умолчанию пишем на уровень "test"
    * @param {String} root 
    */
   constructor(root='test') {
      this._db = database;
      this._root = root ? `/${root}/`: '/' ;
      this._user = localStorage.getItem('userName') ? localStorage.getItem('userName') : 'demo-user';
   }

   /**
    * Возвращает формат данных для вставки задачи
    */
   getFormatTask() {
      return {
         id: Date.now(),  // уникальный идентификатор
         description: '', // описание задачи
         theme: '',       // раздел обучения, уникальная тема
         additional: '',  // дополнительные данные (подсказки)
         type: '',        // должность
         event: ''        // привязанное событие из controller/*
      };
   }

   /**
    * Получение данных узла, по умолчанию возвращает все
    * @param {String} field
    * @returns {Promise}
    */
   get(field = '') {
      const ref = this._db
         .ref(this._root + field)
         .once('value')
         .then(
            function(snapshot) {
               return snapshot.val();
            },
            function(error) {
               return error;
            },
         );

      return ref;
   }

   /**
    * Создание задачи - берет данные по формату
    * @param {Object} data 
    */
   createTask(data) {
      const format = this.getFormatTask();
      const taskData = Object.assign(format, data);
      this.set('tasks/task-' + taskData.id, taskData);
      return taskData;
   }

   /**
    * Создание данных узла, при отсутствии данных выбрасывает ошибку (опасно, возможна потеря данных DB)
    * @param {String} field
    * @returns {Promise}
    */
   set(field, data) {
      if (field) {
         const ref = this._db.ref(this._root + field).set(data, function(error) {
            if (error) {
               return error;
            } else {
               return true;
            }
         });
         return ref;
      } else {
         throw Error(
            'Попытка перезаписать корень хранилища, операция запрещена!',
         );
      }
   }

   /**
    * Запись задачи
    * @param {String} field
    * @returns {Promise}
    */
   setTask(field, data) {
      return this.set('tasks/' + field, data);
   }

   /**
    * Обновление задачи
    * @param {String} key
    * @param {Object} data
    * @returns {Promise}
    */
   updateTask(key, data) {
      const updates = {};
      updates['/tasks/' + key] = data;

      return this._db.ref().update(updates);
   }

   /**
    * Удалить задачу
    * @param {String} key
    * @returns {Promise} 
    */
   removeTask(key) {
      return this._db.ref(`/tasks/${key}`).remove();
   }

   /**
    * Добавляет статус задачи
    * @param {String} taskId 
    * @param {String} user 
    * @param {String} state 
    * @returns {Promise}
    */
   setState(taskId, state) {
      const updates = {};
      const user = this.getUser();
      const stateTask = {
         state,
         user
      };
      updates[`/progress/${user}/${taskId}`] = stateTask;
      return this._db.ref().update(updates);
   }
   
   /**
    * Список состояний по задачам
    * @returns {Promise}
    */
   getState() {
      const user = this.getUser();
      return this.get(`/progress/${user}`);
   }

   /**
    * Получить текущего пользователя
    * @returns {String}
    */
   getUser() {
      return this._user;
   }
}

export default DataBaseApi;
