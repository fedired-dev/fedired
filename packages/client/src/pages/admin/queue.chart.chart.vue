<template>
	<canvas ref="chartEl"></canvas>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
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
import { defaultStore } from "@/store";
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
	type: string;
}>();

const alpha = (hex, a) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)!;
	const r = Number.parseInt(result[1], 16);
	const g = Number.parseInt(result[2], 16);
	const b = Number.parseInt(result[3], 16);
	return `rgba(${r}, ${g}, ${b}, ${a})`;
};

const chartEl = ref<HTMLCanvasElement | null>(null);

const gridColor = defaultStore.state.darkMode
	? "rgba(255, 255, 255, 0.1)"
	: "rgba(0, 0, 0, 0.1)";

// フォントカラー
Chart.defaults.color = getComputedStyle(
	document.documentElement,
).getPropertyValue("--fg");

const { handler: externalTooltipHandler } = useChartTooltip();

let chartInstance: Chart;

function setData(values) {
	if (chartInstance == null) return;
	for (const value of values) {
		chartInstance.data.labels.push("");
		chartInstance.data.datasets[0].data.push(value);
		if (chartInstance.data.datasets[0].data.length > 200) {
			chartInstance.data.labels.shift();
			chartInstance.data.datasets[0].data.shift();
		}
	}
	chartInstance.update();
}

function pushData(value) {
	if (chartInstance == null) return;
	chartInstance.data.labels.push("");
	chartInstance.data.datasets[0].data.push(value);
	if (chartInstance.data.datasets[0].data.length > 200) {
		chartInstance.data.labels.shift();
		chartInstance.data.datasets[0].data.shift();
	}
	chartInstance.update();
}

const label =
	props.type === "process"
		? "Process"
		: props.type === "active"
			? "Active"
			: props.type === "delayed"
				? "Delayed"
				: props.type === "waiting"
					? "Waiting"
					: ("?" as never);

const color =
	props.type === "process"
		? "#9ccfd8"
		: props.type === "active"
			? "#858AFA"
			: props.type === "delayed"
				? "#eb6f92"
				: props.type === "waiting"
					? "#f6c177"
					: ("?" as never);

onMounted(() => {
	chartInstance = new Chart(chartEl.value, {
		type: "line",
		data: {
			labels: [],
			datasets: [
				{
					label,
					pointRadius: 0,
					tension: 0.3,
					borderWidth: 2,
					borderJoinStyle: "round",
					borderColor: color,
					backgroundColor: alpha(color, 0.1),
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
					grid: {
						display: true,
						color: gridColor,
						borderColor: "rgb(0, 0, 0, 0)",
					},
					ticks: {
						display: false,
						maxTicksLimit: 10,
					},
				},
				y: {
					min: 0,
					grid: {
						color: gridColor,
						borderColor: "rgb(0, 0, 0, 0)",
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
});

defineExpose({
	setData,
	pushData,
});
</script>
