import { Link, Stack } from "expo-router";
import { StyleSheet, View, Text } from "react-native";
import colors from "@/constants/colors";
import { typography, sizes } from "@/constants/typography";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Page not found.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Return to beginning</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: colors.light.background,
  },
  title: {
    ...typography.serif.semibold,
    fontSize: sizes.large,
    color: colors.light.text,
  },
  link: {
    marginTop: 32,
    paddingVertical: 12,
  },
  linkText: {
    ...typography.sans.medium,
    fontSize: sizes.body,
    color: colors.light.accent,
  },
});
