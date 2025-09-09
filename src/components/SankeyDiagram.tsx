"use client";

import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyNodeMinimal } from 'd3-sankey';
import { useEffect, useRef, useState } from 'react';
import { useCategories } from '../contexts/CategoryContext'; // 新增导入

interface SankeyDiagramProps {
    data: { [key: string]: number };
}

const SankeyDiagram = ({ data }: SankeyDiagramProps) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // 创建tooltip引用
    const tooltipRef = useRef<HTMLDivElement>(null);
    const { getAllCategoriesWithItems } = useCategories(); // 使用分类上下文

    // 定义数据
    const transformData = (assetsData: { [key: string]: number }) => {
        // 获取所有分类和子项
        const allCategories = getAllCategoriesWithItems();

        // 初始化节点和连接数组
        const nodes: { id: number; name: string; category: string; value?: number; x0?: number; x1?: number; y0?: number; y1?: number }[] = [];
        const links: { source: number; target: number; value: number }[] = [];

        // 创建节点ID映射
        const nodeIdMap: { [key: string]: number } = {};
        let nodeId = 0;

        // 添加"总资产"节点
        nodes.push({ id: nodeId, name: "总资产", category: "total" });
        nodeIdMap["总资产"] = nodeId++;

        // 为每个分类创建节点
        Object.keys(allCategories).forEach(category => {
            // 跳过负债分类，因为它不在资产桑基图中
            if (category === '负债') return;

            nodes.push({ id: nodeId, name: category, category: getCategoryType(category) });
            nodeIdMap[category] = nodeId++;

            // 计算分类总值
            const categoryValue = allCategories[category].reduce((sum, item, index) => {
                const fieldName = convertToFieldName(category, item, index);
                const value = assetsData[fieldName] || 0;
                return sum + value;
            }, 0);

            // 只有当值大于0时才创建从"总资产"到分类的连接
            if (categoryValue > 0) {
                links.push({
                    source: nodeIdMap["总资产"],
                    target: nodeIdMap[category],
                    value: Math.max(0.01, categoryValue)
                });
            }

            // 为每个子项创建节点
            allCategories[category].forEach((item, index) => {
                const fieldName = convertToFieldName(category, item, index);
                const itemValue = assetsData[fieldName] || 0;

                // 只有当值大于0时才创建节点和连接
                if (itemValue > 0) {
                    nodes.push({ id: nodeId, name: item, category: "detail" });
                    nodeIdMap[item] = nodeId++;

                    links.push({
                        source: nodeIdMap[category],
                        target: nodeIdMap[item],
                        value: Math.max(0.01, itemValue)
                    });
                }
            });
        });

        return { nodes, links };
    };

    // 获取分类类型
    const getCategoryType = (category: string) => {
        const categoryTypes: { [key: string]: string } = {
            '流动资金': 'liquid',
            '固定资产': 'fixed',
            '投资理财': 'investment',
            '应收款项': 'receivable'
        };
        return categoryTypes[category] || 'detail';
    };

    // 将中文分类和子项转换为英文字段名（与Form.jsx中的一致）
    const convertToFieldName = (category: string, item: string, index: number) => {
        const categoryMap: { [key: string]: { [key: string]: string } } = {
            '流动资金': {
                '银行活期': 'currentDeposit',
                '支付宝': 'alipay',
                '微信': 'wechat'
            },
            '固定资产': {
                '车辆价值': 'car',
                '房产价值': 'house'
            },
            '投资理财': {
                '定期存款': 'fixedDeposit',
                '股票基金': 'stocks'
            },
            '应收款项': {
                '他人借款': 'receivable'
            },
            '负债': {
                '车贷': 'carLoan',
                '房贷': 'mortgage',
                '借贷': 'borrowing'
            }
        };

        // 对于默认子项，使用预定义的字段名
        if (categoryMap[category] && categoryMap[category][item]) {
            return categoryMap[category][item];
        } else {
            // 为自定义子项创建唯一标识符，包含索引确保唯一性
            const safeCategory = category.replace(/[^a-zA-Z0-9]/g, '');
            const safeItem = item.replace(/[^a-zA-Z0-9]/g, '');
            return `${safeCategory}_${safeItem}_${index}`;
        }
    };

    const sankeyGeneratorRef = useRef<any>(null);

    useEffect(() => {
        // 更新容器尺寸
        const updateSize = () => {
            if (svgRef.current) {
                const width = svgRef.current.clientWidth;
                const height = svgRef.current.clientHeight;
                if (width > 0 && height > 0) {
                    setContainerSize({ width, height });
                }
            }
        };

        // 使用 ResizeObserver 来监听容器大小变化
        const resizeObserver = new ResizeObserver(updateSize);

        if (svgRef.current) {
            resizeObserver.observe(svgRef.current);
            updateSize(); // 初始化尺寸
        }

        window.addEventListener('resize', updateSize);

        return () => {
            window.removeEventListener('resize', updateSize);
            if (svgRef.current) {
                resizeObserver.unobserve(svgRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!svgRef.current || !data) return;

        // 添加数据校验
        // 如果数据都是0，使用测试数据
        const hasNonZeroData = Object.values(data).some(value => value > 0);
        const processedData = hasNonZeroData ? data : {
            currentDeposit: 50000,
            alipay: 10000,
            wechat: 5000,
            car: 150000,
            house: 3000000,
            fixedDeposit: 200000,
            stocks: 100000,
            receivable: 0,
            carLoan: 50000,
            mortgage: 2000000,
            borrowing: 0
        };

        const sankeyData = transformData(processedData);
        if (!sankeyData.nodes || !sankeyData.links) {
            console.error('Invalid sankey data');
            return;
        }
        if (sankeyData.nodes.length === 0 || sankeyData.links.length === 0) {
            console.warn('No nodes or links to display');
            // 显示一个提示信息
            if (svgRef.current) {
                d3.select(svgRef.current)
                    .append("text")
                    .attr("x", "50%")
                    .attr("y", "50%")
                    .attr("text-anchor", "middle")
                    .attr("fill", "#666")
                    .text("暂无资产数据，请添加资产数据后查看图表");
            }
            return;
        }

        const cleanup = drawSankey(sankeyData);

        // 返回清理函数
        return () => {
            d3.select(svgRef.current).selectAll("*").remove();
            if (cleanup) cleanup();
        };
    }, [data, containerSize.width, containerSize.height]);


    const drawSankey = (sankeyData: { nodes: { id: number; name: string; category: string; value?: number; x0?: number; x1?: number; y0?: number; y1?: number }[]; links: { source: number; target: number; value: number }[] }) => {
        // 设置图表尺寸 - 响应式边距
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
        const margin = {
            top: 20,
            right: isMobile ? 80 : (isTablet ? 120 : 150),
            bottom: 20,
            left: isMobile ? 80 : (isTablet ? 120 : 150)
        };
        const width = containerSize.width - margin.left - margin.right;
        const height = containerSize.height - margin.top - margin.bottom;

        // 清理之前的图表
        d3.select(svgRef.current).selectAll("svg").remove();

        // 创建SVG容器
        const svg = d3.select(svgRef.current)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("class", "w-full h-[400px]")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // 创建tooltip
        const tooltip = d3.select(tooltipRef.current);

        // 计算数据的最大值用于比例缩放
        const maxValue = Math.max(...sankeyData.links.map(link => link.value));
        const minValue = Math.min(...sankeyData.links.map(link => link.value));
        const valueRange = maxValue - minValue;

        console.log('Sankey - Data range:', { minValue, maxValue, valueRange });
        console.log('Sankey - Link values:', sankeyData.links.map(link => ({ value: link.value, source: link.source, target: link.target })));

        const sankeyGenerator = sankey()
            .nodeWidth(isMobile ? 15 : 20)
            .nodePadding(isMobile ? 25 : 35)
            .extent([[0, 0], [width, height]])
            .iterations(32); // 增加迭代次数以获得更好的布局
        sankeyGeneratorRef.current = sankeyGenerator;


        // 转换数据为d3-sankey格式
        console.log('Sankey - Input to sankeyGenerator:', {
            nodes: sankeyData.nodes,
            links: sankeyData.links
        });

        const { nodes, links } = sankeyGenerator({
            nodes: sankeyData.nodes.map(d => Object.assign({}, d)),
            links: sankeyData.links.map(d => ({
                source: d.source,
                target: d.target,
                value: d.value
            }))
        });

        console.log('Sankey - Output from sankeyGenerator:', {
            nodes: nodes.map(n => ({ name: n.name, value: n.value, x0: n.x0, x1: n.x1, y0: n.y0, y1: n.y1 })),
            links: links.map(l => ({ value: l.value, width: l.width, source: l.source, target: l.target }))
        });

        // 设置节点颜色
        const nodeColor = (d: { category: string } | SankeyNodeMinimal<{}, {}>) => {
            // 确保我们处理的是具有category属性的对象
            if (typeof d === 'object' && 'category' in d) {
                const colors: { [key: string]: string } = {
                    "total": "#4c78a8",
                    "liquid": "#72b7b2",
                    "fixed": "#eeca3b",
                    "investment": "#f58518",
                    "receivable": "#437c17",
                    "detail": "#9d755d"
                };
                return colors[(d as { category: string }).category] || "#999";
            }
            return "#999";
        };

        // 创建连接
        const link = svg.append("g")
            .selectAll(".link")
            .data(links)
            .enter()
            .append("path")
            .attr("class", "link sankey-link")
            .attr("d", sankeyLinkHorizontal())
            .attr("fill", "none")
            .attr("stroke", d => {
                // 简化颜色逻辑，直接使用source节点的颜色
                if (d.source && typeof d.source === 'object' && 'category' in d.source) {
                    return nodeColor(d.source);
                }
                return "#999"; // 默认颜色
            })
            .attr("stroke-width", d => {
                // 使用线性比例缩放，直接反映数据差异
                const minWidth = isMobile ? 3 : 5;
                const maxWidth = isMobile ? 40 : 60;

                // 确保有有效的数据范围
                if (maxValue <= minValue) {
                    return minWidth;
                }

                // 线性比例计算
                const ratio = (d.value - minValue) / (maxValue - minValue);
                const scaledWidth = minWidth + ratio * (maxWidth - minWidth);

                console.log(`Sankey - Link width calculation:`, {
                    value: d.value,
                    ratio: ratio.toFixed(3),
                    width: scaledWidth.toFixed(1)
                });

                return Math.max(minWidth, Math.min(maxWidth, scaledWidth));
            })
            .attr("stroke-opacity", 0.5)
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .attr("stroke-opacity", 0.8);
                tooltip.style("opacity", 1)
                    .html(`<strong>金额:</strong> ¥${d.value.toLocaleString()}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function () {
                d3.select(this)
                    .attr("stroke-opacity", 0.5);
                tooltip.style("opacity", 0);
            });

        // 创建节点
        const node = svg.append("g")
            .selectAll(".node")
            .data(nodes)
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x0},${d.y0})`)
            .on("mouseover", function (event, d) {
                // 高亮相关连接
                link.style("stroke-opacity", l => {
                    // 检查链接是否与当前节点相关
                    if (typeof l.source === 'number' && typeof l.target === 'number') {
                        // 如果source和target是索引
                        return l.source === d.index || l.target === d.index ? 0.8 : 0.1;
                    } else if (typeof l.source === 'object' && typeof l.target === 'object') {
                        // 如果source和target是对象
                        return (l.source as SankeyNodeMinimal<{}, {}>).index === d.index ||
                            (l.target as SankeyNodeMinimal<{}, {}>).index === d.index ? 0.8 : 0.1;
                    }
                    return 0.1; // 默认不透明度
                });

                // 从节点数据中提取name属性
                const nodeName = 'name' in d ? d.name as string : '';
                let tooltipText = `<strong>${nodeName}</strong>`;
                if ('value' in d && d.value) {
                    tooltipText += `<br>金额: ¥${d.value.toLocaleString()}`;
                }

                tooltip.style("opacity", 1)
                    .html(tooltipText)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function () {
                link.style("stroke-opacity", 0.5);
                tooltip.style("opacity", 0);
            });

        // 添加节点矩形
        node.append("rect")
            .attr("height", d => (d.y1 || 0) - (d.y0 || 0))
            .attr("width", d => (d.x1 || 0) - (d.x0 || 0))
            .attr("fill", nodeColor);

        // 添加节点标签
        node.append("text")
            .attr("x", d => {
                // 从节点数据中提取category属性
                const category = 'category' in d ? d.category as string : '';
                if (category === "total") return isMobile ? -5 : -8;
                if (category === "detail") return (d.x1 || 0) - (d.x0 || 0) + (isMobile ? 5 : 8);
                return ((d.x1 || 0) - (d.x0 || 0)) / 2;
            })
            .attr("y", d => ((d.y1 || 0) - (d.y0 || 0)) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", d => {
                // 从节点数据中提取category属性
                const category = 'category' in d ? d.category as string : '';
                if (category === "total") return "end";
                if (category === "detail") return "start";
                return "middle";
            })
            .attr("font-size", isMobile ? "10px" : (isTablet ? "11px" : "12px"))
            .text(d => {
                const name = 'name' in d ? d.name as string : '';
                // 对于长标签，在小屏幕上进行截断
                if (isMobile && name.length > 6) {
                    return name.substring(0, 5) + '...';
                }
                return name;
            })
            .attr("fill", "#333");

        // 响应式调整
        const resizeSankey = () => {
            if (!svgRef.current) return;

            // 重新计算设备类型
            const currentIsMobile = window.innerWidth < 768;
            const currentIsTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

            const newWidth = containerSize.width - margin.left - margin.right;
            const newHeight = containerSize.height - margin.top - margin.bottom;

            d3.select(svgRef.current).select("svg")
                .attr("width", newWidth + margin.left + margin.right)
                .attr("height", newHeight + margin.top + margin.bottom);

            // 重新计算桑基图布局
            sankeyGenerator.extent([[0, 0], [newWidth, newHeight]]);

            const updatedData = sankeyGenerator({
                nodes: sankeyData.nodes.map(d => Object.assign({}, d)),
                links: sankeyData.links.map(d => Object.assign({}, d))
            });

            // 更新连接
            svg.selectAll(".link")
                .data(updatedData.links)
                .attr("d", sankeyLinkHorizontal())
                .attr("stroke-width", d => {
                    // 使用线性比例缩放，直接反映数据差异
                    const minWidth = currentIsMobile ? 3 : 5;
                    const maxWidth = currentIsMobile ? 40 : 60;

                    // 重新计算数据范围
                    const currentMaxValue = Math.max(...updatedData.links.map(link => link.value));
                    const currentMinValue = Math.min(...updatedData.links.map(link => link.value));

                    // 确保有有效的数据范围
                    if (currentMaxValue <= currentMinValue) {
                        return minWidth;
                    }

                    // 线性比例计算
                    const ratio = (d.value - currentMinValue) / (currentMaxValue - currentMinValue);
                    const scaledWidth = minWidth + ratio * (maxWidth - minWidth);

                    return Math.max(minWidth, Math.min(maxWidth, scaledWidth));
                });

            // 更新节点位置
            svg.selectAll(".node")
                .data(updatedData.nodes)
                .attr("transform", d => `translate(${d.x0 || 0},${d.y0 || 0})`)
                .select("rect")
                .attr("height", d => (d.y1 || 0) - (d.y0 || 0))
                .attr("width", d => (d.x1 || 0) - (d.x0 || 0));
        };

        // 添加窗口大小变化监听器
        const handleResize = () => {
            resizeSankey();
        };

        window.addEventListener('resize', handleResize);

        // 在组件卸载时移除事件监听器
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    };


    return (
        <div className="w-full">
            <style jsx>{`
                .sankey-link {
                    transition: stroke-opacity 0.3s ease;
                }
                .sankey-link:hover {
                    stroke-opacity: 0.8 !important;
                }
            `}</style>
            <div
                className="w-full h-[300px] md:h-[400px]"
                style={{ width: '100%', height: '100%' }}
            >
                <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
            </div>
            <div className="tooltip absolute bg-black bg-opacity-80 text-white p-2 rounded pointer-events-none opacity-0" ref={tooltipRef} style={{ opacity: 0, position: 'absolute', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', padding: '8px', borderRadius: '4px', pointerEvents: 'none' }}></div>
        </div>
    );

};

export default SankeyDiagram;