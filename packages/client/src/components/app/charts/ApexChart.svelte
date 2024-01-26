<script>
  import { getContext } from "svelte"
  import ApexCharts from 'apexcharts'
  import { Icon } from "@budibase/bbui"

  const { styleable, builderStore } = getContext("sdk")
  const component = getContext("component")

  export let options

  let chartElement;
  let chart;

  const updateChart = async (newOptions) => {
    try {
      await chart?.updateOptions(newOptions)
    } catch(e) {
      //console.log(e)
    }
  }

  const renderChart = async (newChartElement) => {
    try {
      await chart?.destroy()
      chart = new ApexCharts(newChartElement, options)
      await chart.render()
    } catch(e) {
      //console.log(e)
    }
  }

  const isDataValid = (series) => {
    console.log(series);
    if (series.length === 0) return true;

    // array of objects form of series
    if (Array.isArray(series[0]?.data)) {
      for (let entry of series) {
        if (entry?.data?.some(datum => {
          if (datum?.x) {
            return true
          }

          else if (Array.isArray(datum)) {
            return datum.some(datumValue => typeof datumValue === "number");
          }

          return typeof datum === "number"
        })) {
          return true;
        }
      }

      return false;
    // array of numbers form of series
    } else {
      return series.some(s => typeof s === "number");
    }
  }

  $: renderChart(chartElement)
  $: updateChart(options)
  $: dataValid = isDataValid(options?.series || [])

  $: noData = options == null || options?.series?.length === 0

  $: hide = noData || !dataValid

</script>

{#key options?.customColor}
  <div class:hide use:styleable={$component.styles} bind:this={chartElement} />
  {#if $builderStore.inBuilder && noData }
    <div class="component-placeholder" use:styleable={{ ...$component.styles, normal: {}, custom: null, empty: true }}>
      <Icon name="Alert" color="var(--spectrum-global-color-static-red-600)" />
      Add rows to your data source to start using your component
    </div>
  {:else if $builderStore.inBuilder && !dataValid}
    <div class="component-placeholder" use:styleable={{ ...$component.styles, normal: {}, custom: null, empty: true }}>
      <Icon name="Alert" color="var(--spectrum-global-color-static-red-600)" />
      Your selected data cannot be displayed in this chart
    </div>
  {/if}

{/key}

<style>
  .hide {
    display: none;
  }
  div :global(.apexcharts-legend-series) {
    display: flex !important;
    text-transform: capitalize;
  }
  div :global(.apexcharts-text.apexcharts-xaxis-title-text),
  div :global(.apexcharts-text.apexcharts-yaxis-title-text),
  div :global(.apexcharts-text.apexcharts-xaxis-label),
  div :global(.apexcharts-text.apexcharts-yaxis-label),
  div :global(.apexcharts-title-text) {
    fill: var(--spectrum-global-color-gray-600);
  }

  div :global(.apexcharts-gridline) {
    stroke: var(--spectrum-global-color-gray-600);
  }
  div :global(.apexcharts-legend-text) {
    color: var(--spectrum-global-color-gray-700) !important;
  }
  div :global(.apexcharts-datalabel) {
    fill: white;
  }
  div :global(.apexcharts-tooltip) {
    background-color: var(--spectrum-global-color-gray-200) !important;
    border-color: var(--spectrum-global-color-gray-300) !important;
    box-shadow: 2px 2px 6px -4px rgba(0, 0, 0, 0.1) !important;
  }
  div :global(.apexcharts-tooltip-title) {
    background-color: var(--spectrum-global-color-gray-100) !important;
    border-color: var(--spectrum-global-color-gray-300) !important;
  }
  div :global(.apexcharts-theme-dark .apexcharts-tooltip-text) {
    color: white;
  }
  div
    :global(
      .apexcharts-theme-dark .apexcharts-tooltip-series-group.apexcharts-active
    ) {
    padding-bottom: 0;
  }

  .component-placeholder {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    color: var(--spectrum-global-color-gray-600);
    font-size: var(--font-size-s);
    padding: var(--spacing-xs);
    gap: var(--spacing-s);
  }

  /* Common styles for all error states to use */
  .component-placeholder :global(mark) {
    background-color: var(--spectrum-global-color-gray-400);
    padding: 0 4px;
    border-radius: 2px;
  }
  .component-placeholder :global(.spectrum-Link) {
    cursor: pointer;
  }
</style>
