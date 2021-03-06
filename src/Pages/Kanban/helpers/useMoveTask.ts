import { useState } from 'react';
import { useGetColumns } from 'Hooks/useGetColumns';
import { useGetSections } from 'Hooks/useGetSections';
import { useManageColumn } from 'Hooks/useManageColumn';
import { useCustomToast } from 'shared/helpers/useCustomToast';
import { TaskType } from 'shared/types/Kanban.type';
import { useQueryClient } from 'react-query';

type UseMoveTaskType = {
  task: TaskType;
  index: number;
  sourceColumnId: string;
  destinationColumnId: string;
};
export const useMoveTask = () => {
  const queryClient = useQueryClient();
  const [movedTaskIndex, setMovedTaskIndex] = useState<null | number>(null);
  const [moveTaskInfo, setMoveTaskInfo] = useState({
    sourceColumnId: '',
    destinationColumnId: '',
  });
  const { mutateAsync, isLoading } = useManageColumn();
  const { data: columns } = useGetColumns();
  const { sections } = useGetSections();

  const moveTask = ({
    task,
    sourceColumnId,
    index,
    destinationColumnId,
  }: UseMoveTaskType) => {
    const columnId = destinationColumnId.split(':')[0];
    const prevColumnId = sourceColumnId.split(':')[0];
    const sectionID = destinationColumnId.split(':')[1];

    setMoveTaskInfo({
      sourceColumnId,
      destinationColumnId,
    });

    mutateAsync({
      method: 'PATCH',
      payload: {
        index,
        column: columnId,
        prevColumn: prevColumnId,
        idSection: sectionID,
      },
      endpoint: `tasks/${task.id}`,
    }).then(() => {
      useCustomToast({ text: 'Task successfully moved', type: 'success' });
      const column = columns.find(({ id }) => id === columnId);

      if (
        column &&
        column?.tasks.length >= column?.numberOfTasks &&
        column.numberOfTasks
      ) {
        useCustomToast({
          text: `Maximum number of tasks allowed in ${column.name} column has been exceeded`,
          type: 'error',
          autoClose: 2500,
        });
      }

      const sectionTaskLimit = sections.find(
        ({ id }) => id === sectionID
      )?.taskLimit;

      const sectionName = sections.find(({ id }) => id === sectionID)?.name;

      const sectionTasks = columns.reduce(
        (sum, columnn) =>
          sum +
          columnn.tasks.filter(({ idSection }) => idSection === sectionID)
            .length,
        0
      );

      if (column && sectionTaskLimit && sectionTasks >= sectionTaskLimit) {
        useCustomToast({
          text: `Maximum number of tasks allowed in ${sectionName} section has been reached`,
          type: 'error',
          autoClose: 2500,
        });
      }

      setMoveTaskInfo({
        sourceColumnId: '',
        destinationColumnId: '',
      });

      setMovedTaskIndex(null);
      queryClient.invalidateQueries('columns');
    });
  };

  return {
    moveTask,
    sourceColumnId: moveTaskInfo.sourceColumnId,
    destinationColumnId: moveTaskInfo.destinationColumnId,
    movedTaskIndex,
    setMovedTaskIndex,
    isLoading,
  };
};
