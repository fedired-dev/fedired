<template>
	<canvas ref="chartEl"></canvas>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue";
import {
	ArcElement,
	BarController,
	BarElement,
	CategoryScale,
	Chart,
	Filler,
	Legend,
	LineController,
	LineElement,
	LinearScale,
	PointElement,
	SubTitle,
	TimeScale,
	Title,
	Tooltip,
} from "chart.js";
import { useChartTooltip } from "@/scripts/use-chart-tooltip";

Chart.register(
	ArcElement,
	LineElement,
	BarElement,
	PointElement,
	BarController,
	LineController,
	CategoryScale,
	LinearScale,
	TimeScale,
	Legend,
	Title,
	Tooltip,
	SubTitle,
	Filler,
);

const props = defineProps<{
	domain: string;
	connection: any;
}>();

const alpha = (hex, a) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)!;
	const r = Number.parseInt(result[1], 16);
	const g = Number.parseInt(result[2], 16);
	const b = Number.parseInt(result[3], 16);
	return `rgba(${r}, ${g}, ${b}, ${a})`;
};

const chartEl = ref<HTMLCanvasElement | null>(null);

// フォントカラー
Chart.defaults.color = getComputedStyle(
	document.documentElement,
).getPropertyValue("--fg");

const { handler: externalTooltipHandler } = useChartTooltip();

let chartInstance: Chart;

const onStats = (stats) => {
	chartInstance.data.labels?.push("");
	chartInstance.data.datasets[0].data.push(
		stats[props.domain].activeSincePrevTick,
	);
	chartInstance.data.datasets[1].data.push(stats[props.domain].active);
	chartInstance.data.datasets[2].data.push(stats[props.domain].waiting);
	chartInstance.data.datasets[3].data.push(stats[props.domain].delayed);
	if (chartInstance.data.datasets[0].data.length > 100) {
		chartInstance.data.labels?.shift();
		chartInstance.data.datasets[0].data.shift();
		chartInstance.data.datasets[1].data.shift();
		chartInstance.data.datasets[2].data.shift();
		chartInstance.data.datasets[3].data.shift();
	}
	chartInstance.update();
};

const onStatsLog = (statsLog) => {
	for (const stats of [...statsLog].reverse()) {
		chartInstance.data.labels?.push("");
		chartInstance.data.datasets[0].data.push(
			stats[props.domain].activeSincePrevTick,
		);
		chartInstance.data.datasets[1].data.push(stats[props.domain].active);
		chartInstance.data.datasets[2].data.push(stats[props.domain].waiting);
		chartInstance.data.datasets[3].data.push(stats[props.domain].delayed);
		if (chartInstance.data.datasets[0].data.length > 100) {
			chartInstance.data.labels?.shift();
			chartInstance.data.datasets[0].data.shift();
			chartInstance.data.datasets[1].data.shift();
			chartInstance.data.datasets[2].data.shift();
			chartInstance.data.datasets[3].data.shift();
		}
	}
	chartInstance.update();
};

onMounted(() => {
	chartInstance = new Chart(chartEl.value, {
		type: "line",
		data: {
			labels: [],
			datasets: [
				{
					label: "Process",
					pointRadius: 0,
					tension: 0.3,
					borderWidth: 2,
					borderJoinStyle: "round",
					borderColor: "#9ccfd8",
					backgroundColor: alpha("#9ccfd8", 0.1),
					data: [],
				},
				{
					label: "Active",
					pointRadius: 0,
					tension: 0.3,
					borderWidth: 2,
					borderJoinStyle: "round",
					borderColor: "#31748f",
					backgroundColor: alpha("#31748f", 0.1),
					data: [],
				},
				{
					label: "Waiting",
					pointRadius: 0,
					tension: 0.3,
					borderWidth: 2,
					borderJoinStyle: "round",
					borderColor: "#f6c177",
					backgroundColor: alpha("#f6c177", 0.1),
					data: [],
				},
				{
					label: "Delayed",
					pointRadius: 0,
					tension: 0.3,
					borderWidth: 2,
					borderJoinStyle: "round",
					borderColor: "#eb6f92",
					borderDash: [5, 5],
					fill: false,
					data: [],
				},
			],
		},
		options: {
			aspectRatio: 2.5,
			layout: {
				padding: {
					left: 0,
					right: 0,
					top: 0,
					bottom: 0,
				},
			},
			scales: {
				x: {
					display: false,
					grid: {
						display: false,
					},
					ticks: {
						display: false,
						maxTicksLimit: 10,
					},
				},
				y: {
					display: false,
					min: 0,
					grid: {
						display: false,
					},
					ticks: {
						display: false,
					},
				},
			},
			interaction: {
				intersect: false,
			},
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					enabled: false,
					mode: "index",
					animation: {
						duration: 0,
					},
					external: externalTooltipHandler,
				},
			},
		},
	});

	props.connection.on("stats", onStats);
	props.connection.on("statsLog", onStatsLog);
});

onUnmounted(() => {
	props.connection.off("stats", onStats);
	props.connection.off("statsLog", onStatsLog);
});
</script>
