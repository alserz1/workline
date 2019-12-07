import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import './User.css';
import DataBaseApi from '../../storage/db';

/** Возможные состояния задачи */
const STATE_DONE = 'done';
const STATE_PROCESSING = 'processing';
const STATE_CLOSED = 'closed';

/** Форматирование списка задач - группировка со статусами */
function useGroupedItems(items) {
   return useMemo(() => {
      if (!items || !items.length)
         return [];

      /** Группируем задачи по темам */
      let data = {};
      for (let item of items) {
         if (item.theme in data)
            data[item.theme].push(item);
         else
            data[item.theme] = [item];
      }

      /** Формируем список тем*/
      let themes = [];

      for (let theme of Object.keys(data)) {
         var obj = {
            id: theme,
            theme: theme,
            items: data[theme],
         };

         /** Определяем статус */
         var wasProcessing = false;
         var doneCount = 0;
         for (let item of obj.items) {
            if (item.state===STATE_PROCESSING) {
               wasProcessing = true;
               break;
            }

            if (item.state===STATE_DONE)
               doneCount++
         }
         if (wasProcessing) {
            obj.state = STATE_PROCESSING;
         } else if (doneCount === obj.items.length) {
            obj.state = STATE_DONE;
         } else {
            obj.state = STATE_CLOSED;
         }

         themes.push(obj);
      }

      if ((themes.length > 0) &&
         (themes[0].items.length > 0) &&
         !('state' in themes[0].items[0])) {
         themes[0].items[0].state = STATE_PROCESSING;
         themes[0].state = STATE_PROCESSING;
      }
      return themes;

   }, [items]);
}

/** Сопоставление задачам прогресс */
function useMatchingData(tasks, progress) {
      return useMemo(() => {
         if (!tasks || !progress)
            return [];

         for (let [i,task] of tasks.entries()) {
            let id = ['task',task.id].join('-');
            if (id in progress) {
               tasks[i].state = progress[id].state
            }
         }
         return tasks;
      },[tasks,progress])
}

function LearningPage() {

   const db = useRef();
   const [items, setItems] = useState();
   const [progress, setProgress] = useState();
   const groupedItems = useGroupedItems(useMatchingData(items,progress))

    /** Смена текущего задания для выполнения */
    const changeProcessingItem = useCallback(()=>{
       if (!items || !groupedItems || !groupedItems.length)
          return;
       let newItems = items.slice();
       let current = newItems.findIndex((element)=>element.state===STATE_PROCESSING);
       newItems[current].state = STATE_DONE;
       db.current.setState(newItems[current].id,STATE_DONE);
       channel.current.removeListener(newItems[current].event)
       let cGroup = groupedItems.findIndex((group)=>group.theme===newItems[current].theme);
       let group = groupedItems[cGroup];
       let currentInGroup = group.items.indexOf(newItems[current]);

       if (currentInGroup+1<group.items.length) {
          let idx = newItems.indexOf(group.items[currentInGroup+1]);
          newItems[idx].state = STATE_PROCESSING;
          db.current.setState(newItems[idx].id,STATE_PROCESSING)
       } else {
          if (cGroup+1<groupedItems.length && groupedItems[cGroup+1].items) {
             let idx = newItems.indexOf(groupedItems[cGroup+1].items[0]);
             newItems[idx].state=STATE_PROCESSING;
             db.current.setState(newItems[idx].id,STATE_PROCESSING)
          }
       }
       setItems(newItems)
    }, [groupedItems,items]);

    /** Получение прогресса и задач из БД и подписка на их изменение */
    useEffect(() => {
        db.current = new DataBaseApi();
        db.current.subscribeChanges('tasks', (result) =>{
            setItems(db.current.toArray(result));
        });
        db.current.subscribeChanges('progress/'+db.current.getUser(),(result) => {
            setProgress(result);
        });
    }, [])
    return (
        <div>Hello,world</div>
    );
}

export default LearningPage;
