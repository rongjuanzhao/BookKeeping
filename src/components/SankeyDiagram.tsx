"use client";

import { useEffect, useRef, useState } from 'react';
import { sankey, sankeyLinkHorizontal, SankeyNodeMinimal } from 'd3-sankey';
import * as d3 from 'd3';
import { useCategories } from '../contexts/CategoryContext'; // 新增导入

interface SankeyDiagramProps {
  data: { [key: string]: number };
}

const SankeyDiagram = ({ data }: SankeyDiagramProps) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 800, height: 400 });
    
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
            
            // 创建从"总资产"到分类的连接
            const categoryValue = allCategories[category].reduce((sum, item, index) => {
                const fieldName = convertToFieldName(category, item, index);
                return sum + (assetsData[fieldName] || 0);
            }, 0);
            
            links.push({
                source: nodeIdMap["总资产"],
                target: nodeIdMap[category],
                value: Math.max(0.01, categoryValue)
            });
            
            // 为每个子项创建节点
            allCategories[category].forEach((item, index) => {
                const fieldName = convertToFieldName(category, item, index);
                nodes.push({ id: nodeId, name: item, category: "detail" });
                nodeIdMap[item] = nodeId++;
                
                // 创建从分类到子项的连接
                links.push({
                    source: nodeIdMap[category],
                    target: nodeIdMap[item],
                    value: Math.max(0.01, assetsData[fieldName] || 0)
                });
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
                setContainerSize({
                    width: svgRef.current.clientWidth,
                    height: svgRef.current.clientHeight
                });
            }
        };
        
        updateSize();
        window.addEventListener('resize', updateSize);
        
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {
        if (!svgRef.current || !data) return;
        
        // 清理之前的SVG
        d3.select(svgRef.current).selectAll("svg").remove();
        
        // 添加数据校验
        const sankeyData = transformData(data);
        if (!sankeyData.nodes || !sankeyData.links) {
            console.error('Invalid sankey data');
            return;
        }
        
        drawSankey(sankeyData);
        
        // 返回清理函数
        return () => {
            d3.select(svgRef.current).selectAll("*").remove();
        };
    }, [data, containerSize]);


    const drawSankey = (sankeyData: { nodes: { id: number; name: string; category: string; value?: number; x0?: number; x1?: number; y0?: number; y1?: number }[]; links: { source: number; target: number; value: number }[] }) => {
        // 设置图表尺寸
        const margin = { top: 20, right: 150, bottom: 20, left: 150 };
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
        
        // 添加tooltip容器
        if (tooltipRef.current) {
            tooltipRef.current.className = "tooltip absolute bg-black bg-opacity-80 text-white p-2 rounded pointer-events-none opacity-0";
        }

        // 创建sankey图
        const sankeyGenerator = sankey()
            .nodeWidth(25)
            .nodePadding(40)
            .extent([[0, 0], [width, height]]);
        sankeyGeneratorRef.current = sankeyGenerator;

        
        // 转换数据为d3-sankey格式
        const { nodes, links } = sankeyGenerator({
            nodes: sankeyData.nodes.map(d => Object.assign({}, d)),
            links: sankeyData.links.map(d => Object.assign({}, d))
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
            .attr("class", "link")
            .attr("d", sankeyLinkHorizontal())
            .attr("stroke", d => {
                // 确保source是一个对象而不是索引
                if (typeof d.source === 'object') {
                    return nodeColor(d.source as SankeyNodeMinimal<{}, {}>);
                }
                return "#999"; // 默认颜色
            })
            .attr("stroke-width", d => Math.max(1, d.width || 0))
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
                    // 确保source和target是对象而不是索引
                    if (typeof l.source === 'object' && typeof l.target === 'object' && typeof d === 'object') {
                        return (l.source as SankeyNodeMinimal<{}, {}>).index === d.index || (l.target as SankeyNodeMinimal<{}, {}>).index === d.index ? 0.8 : 0.1;
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
                if (category === "total") return -8;
                if (category === "detail") return (d.x1 || 0) - (d.x0 || 0) + 8;
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
            .text(d => 'name' in d ? d.name as string : '')
            .attr("fill", "#333");

       // 响应式调整
        const resizeSankey = () => {
            if (!svgRef.current) return;
            
            const newWidth = containerSize.width - margin.left - margin.right;
            const newHeight = containerSize.height - margin.top - margin.bottom;
        
            d3.select(svgRef.current).select("svg")
                .attr("width", newWidth + margin.left + margin.right)
                .attr("height", newHeight + margin.top + margin.bottom);
        
            sankeyGenerator.extent([[0, 0], [newWidth, newHeight]]);
        
            const { nodes: newNodes, links: newLinks } = sankeyGenerator({
                nodes: sankeyData.nodes.map(d => Object.assign({}, d)),
                links: sankeyData.links.map(d => Object.assign({}, d))
            });
        
            // 更新连接
            svg.selectAll(".link")
                .data(newLinks)
                .attr("d", sankeyLinkHorizontal())
                .attr("stroke-width", d => Math.max(1, d.width || 0));
        
            // 更新节点位置
            svg.selectAll(".node")
                .data(newNodes)
                .attr("transform", d => `translate(${d.x0 || 0},${d.y0 || 0})`)
                .select("rect")
                .attr("height", d => (d.y1 || 0) - (d.y0 || 0))
                .attr("width", d => (d.x1 || 0) - (d.x0 || 0));
        };

        // 添加窗口大小变化监听器
        window.addEventListener('resize', resizeSankey);
    };


    return (
        <div className="max-w-5xl mx-auto">
            <div
                className="w-full h-[400px]"
                style={{ width: '100%', height: '400px' }}
            >
                <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
            </div>
            <div className="tooltip absolute bg-black bg-opacity-80 text-white p-2 rounded pointer-events-none opacity-0" ref={tooltipRef} style={{opacity: 0, position: 'absolute', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', padding: '8px', borderRadius: '4px', pointerEvents: 'none'}}></div>
        </div>
    );

};

export default SankeyDiagram;