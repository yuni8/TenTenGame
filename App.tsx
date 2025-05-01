import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';

function App(): React.JSX.Element {
  const initialGrid: number[][] = [
    [1, 2, 3, 4],
    [2, 4, 1, 3],
    [0, 3, 1, 9],
    [5, 7, 2, 1]
  ];

  const [grid, setGrid] = useState<number[][]>(initialGrid);
  const [selected, setSelected] = useState<{ row: number; col: number }[]>([]);
  const [score, setScore] = useState<number>(0);

  // 각 타일마다 애니메이션 값 (opacity)
  const animations = useRef<Animated.Value[][]>(
    initialGrid.map(row => row.map(() => new Animated.Value(1)))
  ).current;

  const dropTiles = (grid: number[][]): number[][] => {
    const cols = grid[0].length;
    const rows = grid.length;
    const newGrid = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let col = 0; col < cols; col++) {
      let writeRow = rows - 1;
      for (let readRow = rows - 1; readRow >= 0; readRow--) {
        if (grid[readRow][col] !== 0) {
          newGrid[writeRow][col] = grid[readRow][col];
          writeRow--;
        }
      }
      // 남은 위쪽은 랜덤 숫자 채우기
      for (let r = writeRow; r >= 0; r--) {
        newGrid[r][col] = Math.ceil(Math.random() * 9);
      }
    }
    return newGrid;
  };

  const handleTilePress = (rowIndex: number, colIndex: number) => {
    const alreadySelected = selected.find(pos => pos.row === rowIndex && pos.col === colIndex);
    let newSelected = selected;

    if (alreadySelected) {
      newSelected = selected.filter(pos => !(pos.row === rowIndex && pos.col === colIndex));
      setSelected(newSelected);
    } else {
      newSelected = [...selected, { row: rowIndex, col: colIndex }];
      setSelected(newSelected);
    }

    const selectedSum = newSelected.reduce((sum, pos) => sum + grid[pos.row][pos.col], 0);

    if (selectedSum === 10) {
      // Alert.alert('합이 10!', '선택한 숫자들의 합이 10입니다!');

      const animationsDone = newSelected.map(pos => {
        return new Promise(resolve => {
          Animated.timing(animations[pos.row][pos.col], {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => resolve(true));
        });
      });

      Promise.all(animationsDone).then(() => {
        const newGrid = grid.map(row => [...row]); // ✅ 깊은 복사
        newSelected.forEach(pos => {
          newGrid[pos.row][pos.col] = 0;
          animations[pos.row][pos.col].setValue(1); // 애니메이션 값 리셋
        });

        const droppedGrid = dropTiles(newGrid);
        setGrid(droppedGrid);
        setScore(prev => prev + 5);
        setSelected([]);
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TEN-TEN</Text>

      <View style={styles.scoreBoard}>
        <Text style={styles.score}>Score: {score}</Text>
        <Text style={styles.best}>Best: 0</Text>
      </View>

      <View style={styles.grid}>
        {grid.map((row, rowIndex) => (
          <View style={styles.row} key={rowIndex}>
            {row.map((num, colIndex) => {
              const isSelected = selected.some(pos => pos.row === rowIndex && pos.col === colIndex);
              return (
                <TouchableOpacity
                  key={colIndex}
                  onPress={() => handleTilePress(rowIndex, colIndex)}
                  activeOpacity={0.8}
                >
                  <Animated.View
                    style={[
                      styles.tile,
                      isSelected && { backgroundColor: '#ffcc00' },
                      { opacity: animations[rowIndex][colIndex] }
                    ]}
                  >
                    <Text style={styles.tileText}>{num !== 0 ? num : ''}</Text>
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.playButton}>
        <Text style={styles.playText}>PLAY</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#123456', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, color: '#fff', marginBottom: 20 },
  scoreBoard: { flexDirection: 'row', justifyContent: 'space-between', width: '80%', marginBottom: 20 },
  score: { color: '#fff', fontSize: 16 },
  best: { color: '#fff', fontSize: 16 },
  grid: { backgroundColor: '#444', padding: 4 },
  row: { flexDirection: 'row' },
  tile: { width: 60, height: 60, backgroundColor: '#eee', margin: 2, justifyContent: 'center', alignItems: 'center', borderRadius: 5 },
  tileText: { fontSize: 20, fontWeight: 'bold' },
  playButton: { marginTop: 20, backgroundColor: '#ff9900', padding: 15, borderRadius: 10 },
  playText: { color: '#fff', fontSize: 18 }
});

export default App;
