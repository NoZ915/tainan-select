import periodTimeMap from "../utils/periodTimeMap";
import { Table, Text, Paper } from '@mantine/core';

// 節次與時間
const periods = Object.entries(periodTimeMap).map(([id, time]) => ({
  id,
  time,
}));

// 星期陣列
const weekdays = ["一", "二", "三", "四", "五", "六", "日"];

// 假資料
const timetable: TimetableData = {
  '1': {
    一: { courseName: '國文', color: '#FEEBC8' },
    二: {},
    三: { courseName: '數學', color: '#C6F6D5' },
    // ...
  },
  '2': {
    一: {},
    二: {},
    三: { courseName: '英文', color: '#BEE3F8' },
    // ...
  },
};

const Timetable: React.FC = () => {
  return (
    <Paper withBorder p="md" radius="md">
      <Table
					striped
					highlightOnHover
					style={{ tableLayout: 'fixed', width: '100%' }}
			>
        <thead>
          <tr>
            <th>時間＼星期</th>
            {weekdays.map((day) => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => (
            <tr key={period.id}>
              <td>
                <Text size="sm" fw={500}>
                  第{period.id}節
                  <br />
                  <Text span c="dimmed" size="xs">
                    {period.time}
                  </Text>
                </Text>
              </td>
              {weekdays.map((day) => {
                const cell = timetable[period.id]?.[day];
                return (
                  <td key={day}>
                    {cell?.courseName ? (
                      <Text
                        p={4}
                        style={{ backgroundColor: cell.color, borderRadius: '4px' }}
                        size="sm"
                      >
                        {cell.courseName}
                      </Text>
                    ) : (
                      ''
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </Table>
    </Paper>
  );
}

export default Timetable;