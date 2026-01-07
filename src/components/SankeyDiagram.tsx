"use client";

import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyNodeMinimal } from 'd3-sankey';
import { useEffect, useRef } from 'react';
import { useCategories } from '../contexts/CategoryContext'; // 新增导入

interface SankeyDiagramProps {
    data: { [key: string]: number };
}

const SankeyDiagram = ({ data }: SankeyDiagramProps) => {
    const svgRef = useRef<SVGSVGElement>(null);

    // 创建tooltip引用
    const tooltipRef = useRef<HTMLDivElement>(null);
    const { getAllCategoriesWithItems } = useCategories(); // 使用分类上下文

    // 定义数据 - 重新设计为新的拓扑结构
    const transformData = (assetsData: { [key: string]: number }) => {
        // 获取所有分类和子项
        const allCategories = getAllCategoriesWithItems();

        // 初始化节点和连接数组
        const nodes: { id: number; name: string; category: string; layer: number; value?: number }[] = [];
        const links: { source: number; target: number; value: number }[] = [];

        // 创建节点ID映射
        const nodeIdMap: { [key: string]: number } = {};
        let nodeId = 0;

        // 计算总资产和负债
        let totalAssetsValue = 0;
        let liabilitiesValue = 0;

        const assetCategories = ['流动资金', '固定资产', '投资理财', '应收款项'];

        // 计算总资产（所有资产分类的总和）
        assetCategories.forEach(category => {
            if (allCategories[category]) {
                const categoryValue = allCategories[category].reduce((sum, item, index) => {
                    const fieldName = convertToFieldName(category, item, index);
                    const value = assetsData[fieldName] || 0;
                    return sum + value;
                }, 0);
                totalAssetsValue += categoryValue;
            }
        });

        // 计算负债总值
        if (allCategories['负债']) {
            liabilitiesValue = allCategories['负债'].reduce((sum, item, index) => {
                const fieldName = convertToFieldName('负债', item, index);
                const value = assetsData[fieldName] || 0;
                return sum + value;
            }, 0);
        }

        // 计算净资产（总资产 - 负债）
        const netAssetsValue = totalAssetsValue - liabilitiesValue;

        // 层级0: 添加"净资产"和"负债"节点
        if (netAssetsValue > 0) {
            nodes.push({ id: nodeId, name: "净资产", category: "net_assets", layer: 0, value: netAssetsValue });
            nodeIdMap["净资产"] = nodeId++;
        }

        if (liabilitiesValue > 0) {
            nodes.push({ id: nodeId, name: "负债", category: "liabilities", layer: 0, value: liabilitiesValue });
            nodeIdMap["负债"] = nodeId++;
        }

        // 层级1: 添加"总资产"节点
        if (totalAssetsValue > 0) {
            nodes.push({ id: nodeId, name: "总资产", category: "total_assets", layer: 1, value: totalAssetsValue });
            nodeIdMap["总资产"] = nodeId++;

            // 创建从"净资产"到"总资产"的连接
            if (netAssetsValue > 0) {
                links.push({
                    source: nodeIdMap["净资产"],
                    target: nodeIdMap["总资产"],
                    value: Math.max(0.01, netAssetsValue)
                });
            }

            // 创建从"负债"到"总资产"的连接
            if (liabilitiesValue > 0) {
                links.push({
                    source: nodeIdMap["负债"],
                    target: nodeIdMap["总资产"],
                    value: Math.max(0.01, liabilitiesValue)
                });
            }

            // 层级2: 为每个资产分类创建节点
            assetCategories.forEach(category => {
                if (allCategories[category]) {
                    // 计算分类总值
                    const categoryValue = allCategories[category].reduce((sum, item, index) => {
                        const fieldName = convertToFieldName(category, item, index);
                        const value = assetsData[fieldName] || 0;
                        return sum + value;
                    }, 0);

                    // 只有当分类值大于0时才创建分类节点和连接
                    if (categoryValue > 0) {
                        nodes.push({ id: nodeId, name: category, category: "asset_category", layer: 2 });
                        nodeIdMap[category] = nodeId++;

                        // 创建从"总资产"到分类的连接
                        links.push({
                            source: nodeIdMap["总资产"],
                            target: nodeIdMap[category],
                            value: Math.max(0.01, categoryValue)
                        });

                        // 层级3: 为每个子项创建节点（只显示值大于0的子项）
                        allCategories[category].forEach((item, index) => {
                            const fieldName = convertToFieldName(category, item, index);
                            const itemValue = assetsData[fieldName] || 0;

                            // 只有当值大于0时才创建节点和连接
                            if (itemValue > 0) {
                                nodes.push({ id: nodeId, name: item, category: "asset_detail", layer: 3 });
                                nodeIdMap[item] = nodeId++;

                                links.push({
                                    source: nodeIdMap[category],
                                    target: nodeIdMap[item],
                                    value: Math.max(0.01, itemValue)
                                });
                            }
                        });
                    }
                }
            });
        }

        return { nodes, links };
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
    }, [data]);


    const drawSankey = (sankeyData: { nodes: { id: number; name: string; category: string; layer: number; value?: number }[]; links: { source: number; target: number; value: number }[] }) => {
        // 设置固定图表尺寸
        const width = 900;
        const height = 500;  // 减少高度从600px到500px
        const margin = { top: 20, right: 150, bottom: 20, left: 150 };

        // 清理之前的图表
        d3.select(svgRef.current).selectAll("*").remove();

        // 创建SVG容器
        const svg = d3.select(svgRef.current)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // 创建tooltip
        const tooltip = d3.select(tooltipRef.current);

        // 使用D3的默认配色方案 (Pastel Colors)
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // 设置节点颜色函数
        const nodeColor = (d: { category: string; layer: number; name: string }) => {
            // 根据节点类型设置颜色
            const colorMap: { [key: string]: string } = {
                "net_assets": "#4c78a8",      // 净资产 - 蓝色
                "liabilities": "#e45756",      // 负债 - 红色
                "total_assets": "#72b7b2",     // 总资产 - 青色
                "asset_category": "#f58518",   // 资产分类 - 橙色
                "asset_detail": "#9d755d",     // 资产详细项 - 棕色
                "liability_detail": "#eeca3b"  // 负债详细项 - 黄色
            };
            return colorMap[d.category] || colorScale(d.name);
        };

        // 创建桑基图生成器 - 节点宽度设为10px
        const sankeyGenerator = sankey()
            .nodeWidth(10)  // 节点宽度设为10px
            .nodePadding(40)  // 节点间距
            .extent([[0, 0], [width, height]])
            .nodeId((d: any) => d.id)
            .iterations(32);  // 增加迭代次数以获得更好的布局

        sankeyGeneratorRef.current = sankeyGenerator;

        // 按层级排序节点 - 确保正确的层级结构
        const sortedNodes = [...sankeyData.nodes].sort((a, b) => a.layer - b.layer);

        // 转换数据为d3-sankey格式
        const { nodes, links } = sankeyGenerator({
            nodes: sortedNodes.map(d => Object.assign({}, d)),
            links: sankeyData.links.map(d => Object.assign({}, d))
        });

        // 计算总价值用于百分比计算
        const totalValue = nodes.reduce((sum, node) => {
            const nodeData = node as any;
            if (nodeData.layer === 0 && nodeData.value) {  // 层级1的节点（净资产和负债）
                return sum + nodeData.value;
            }
            return sum;
        }, 0);

        // 创建连线 - 透明度0.5，跟随源节点颜色
        const link = svg.append("g")
            .selectAll(".link")
            .data(links)
            .enter()
            .append("path")
            .attr("class", "link sankey-link")
            .attr("d", sankeyLinkHorizontal())
            .attr("fill", "none")
            .attr("stroke", d => {
                // 连线颜色跟随源节点颜色
                if (d.source && typeof d.source === 'object') {
                    return nodeColor(d.source as any);
                }
                return "#999";
            })
            .attr("stroke-width", d => Math.max(1, d.width || 1))
            .attr("stroke-opacity", 0.5)  // 设置透明度为0.5
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .attr("stroke-opacity", 0.8);
                tooltip.style("opacity", 1)
                    .html(`<strong>金额:</strong> ¥${Math.round(d.value).toLocaleString()}`)
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
                    if (typeof l.source === 'object' && typeof l.target === 'object') {
                        return (l.source as any).index === d.index ||
                               (l.target as any).index === d.index ? 0.8 : 0.1;
                    }
                    return 0.1;
                });

                // 显示tooltip
                const nodeName = (d as any).name || '';
                let tooltipText = `<strong>${nodeName}</strong>`;
                if ((d as any).value) {
                    tooltipText += `<br>金额: ¥${(d as any).value.toLocaleString()}`;
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

        // 添加节点矩形 - 细长矩形条，宽度10px
        node.append("rect")
            .attr("height", d => (d.y1 || 0) - (d.y0 || 0))
            .attr("width", d => (d.x1 || 0) - (d.x0 || 0))
            .attr("fill", d => nodeColor(d as any));

        // 添加节点标签 - 格式：节点名称 + 百分比
        node.append("text")
            .attr("x", d => {
                const layer = (d as any).layer;
                if (layer === 0) return -10;  // 左侧节点（净资产、负债）文字在左边
                if (layer === 1) return ((d.x1 || 0) - (d.x0 || 0)) / 2;  // 总资产节点文字居中
                if (layer === 2) return ((d.x1 || 0) - (d.x0 || 0)) / 2;  // 资产分类节点文字居中
                if (layer === 3) return (d.x1 || 0) - (d.x0 || 0) + 10;  // 右侧节点（子项）文字在右边
                return ((d.x1 || 0) - (d.x0 || 0)) / 2;  // 默认居中
            })
            .attr("y", d => ((d.y1 || 0) - (d.y0 || 0)) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", d => {
                const layer = (d as any).layer;
                if (layer === 0) return "end";  // 左侧节点文字右对齐
                if (layer === 1) return "middle";  // 总资产节点文字居中
                if (layer === 2) return "middle";  // 资产分类节点文字居中
                if (layer === 3) return "start";  // 右侧节点文字左对齐
                return "middle";  // 默认居中
            })
            .attr("font-size", "12px")
            .attr("fill", "#666")  // 深灰色
            .text(d => {
                const name = (d as any).name || '';
                const value = (d as any).value || 0;
                const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(2) : "0.00";
                return `${name} ${percentage}%`;
            });

        // 返回清理函数
        return () => {
            // 清理事件监听器等
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
                className="w-full mx-auto"
                style={{ width: '1200px', height: '540px' }}  // 调整容器高度适应新的SVG尺寸
            >
                <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
            </div>
            <div className="tooltip absolute bg-black bg-opacity-80 text-white p-2 rounded pointer-events-none opacity-0" ref={tooltipRef} style={{ opacity: 0, position: 'absolute', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', padding: '8px', borderRadius: '4px', pointerEvents: 'none' }}></div>
        </div>
    );

};

export default SankeyDiagram;